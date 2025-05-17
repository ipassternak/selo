import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { GameVersion, Prisma, Tag } from '@prisma/client';

import { SuccessResponseDto } from '@lib/dto/lib.dto';
import { GameVersionParseType, GameVersionType } from '@lib/types/game-version';
import { AppException, createAppException } from '@lib/utils/exception';
import { sortBy } from '@lib/utils/query';
import { ApiService } from '@src/api/api.service';
import { PrismaService } from '@src/database/prisma.service';
import { TagService } from '@src/tag/tag.service';

import {
  CreateGameVersionDataDto,
  GameVersionListResponseDto,
  GameVersionResponseDto,
  ListGameVersionParamsDto,
  ParseGameVersionDataDto,
  UpdateGameVersionDataDto,
} from './dto/game-version.dto';
import { GameVersionBaseParser } from './parsers/base.parser';
import { GameVersionManifestParser } from './parsers/manifest.parser';

const AlreadyExistsException = createAppException(
  'Game version already exists',
  HttpStatus.CONFLICT,
  'GV_ERR_ALREADY_EXISTS',
);

@Injectable()
export class GameVersionService {
  private readonly logger = new Logger(GameVersionService.name);

  private readonly parsers: Record<
    GameVersionParseType,
    GameVersionBaseParser
  > = {
    [GameVersionParseType.Manifest]: new GameVersionManifestParser(
      this.apiService,
    ),
  };

  constructor(
    private readonly prismaService: PrismaService,
    private readonly tagService: TagService,
    private readonly apiService: ApiService,
  ) {}

  async list(
    params: ListGameVersionParamsDto,
  ): Promise<GameVersionListResponseDto> {
    const {
      page,
      pageSize,
      sortColumn,
      sortOrder,
      tagNames,
      versionId,
      versionType,
    } = params;

    const where: Prisma.GameVersionWhereInput = {
      ...(tagNames
        ? {
            tags: {
              some: {
                tag: {
                  name: {
                    in: tagNames,
                  },
                },
              },
            },
          }
        : {}),
      versionId: {
        contains: versionId,
        mode: 'insensitive',
      },
      versionType,
    };

    const [data, total] = await Promise.all([
      this.prismaService.gameVersion.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: sortBy(sortColumn, sortOrder),
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      this.prismaService.gameVersion.count({
        where,
      }),
    ]);

    return {
      data,
      meta: {
        total,
      },
    };
  }

  async get(id: string): Promise<GameVersionResponseDto> {
    const gameVersion = await this.prismaService.gameVersion.findUnique({
      where: {
        id,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!gameVersion)
      throw new AppException(
        'Game version does not exist',
        HttpStatus.NOT_FOUND,
      );

    return gameVersion;
  }

  private async checkUniqueVersionId(versionId: string): Promise<void> {
    const gameVersion = await this.prismaService.gameVersion.findUnique({
      where: {
        versionId,
      },
    });

    if (gameVersion) throw new AlreadyExistsException();
  }

  async create(
    data: CreateGameVersionDataDto,
  ): Promise<GameVersionResponseDto> {
    const {
      versionId,
      versionType,
      packageUrl,
      releasedAt,
      tags: tagsData,
    } = data;

    await this.checkUniqueVersionId(versionId);

    let tags: Tag[] | null = null;
    if (tagsData) {
      tags = await this.tagService.getOrCreateTags(tagsData);
    }

    const gameVersion = await this.prismaService.gameVersion.create({
      data: {
        versionId,
        versionType,
        packageUrl,
        releasedAt,
        ...(tags
          ? {
              tags: {
                create: tags.map((tag) => ({
                  tagId: tag.id,
                })),
              },
            }
          : {}),
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return gameVersion;
  }

  async update(
    id: string,
    data: UpdateGameVersionDataDto,
  ): Promise<GameVersionResponseDto> {
    const { versionId, packageUrl, releasedAt, tags: tagsData } = data;

    const gameVersion = await this.get(id);

    let tags: Tag[] | null = null;

    if (tagsData) {
      tags = await this.tagService.getOrCreateTags(tagsData);
    }

    const updatedGameVersion = await this.prismaService.gameVersion.update({
      where: {
        id: gameVersion.id,
      },
      data: {
        versionId: versionId ?? gameVersion.versionId,
        packageUrl: packageUrl ?? gameVersion.packageUrl,
        releasedAt: releasedAt ?? gameVersion.releasedAt,
        ...(tags
          ? {
              tags: {
                deleteMany: {
                  tagId: {
                    notIn: tags.map((tag) => tag.id),
                  },
                },
                create: tags
                  .filter((tag) =>
                    gameVersion.tags?.every(
                      (gameVersionTag) => gameVersionTag.tagId !== tag.id,
                    ),
                  )
                  .map((tag) => ({
                    tagId: tag.id,
                  })),
              },
            }
          : {}),
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return updatedGameVersion;
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.gameVersion
      .delete({
        where: {
          id,
        },
      })
      .catch((err: unknown) => {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === 'P2025')
            throw new AppException(
              'Game version does not exist',
              HttpStatus.NOT_FOUND,
            );
        }

        throw new AppException(
          'Failed to delete game version',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  async parse(data: ParseGameVersionDataDto): Promise<SuccessResponseDto> {
    const { tags: tagsData, source, type } = data;

    const parser = this.parsers[type];

    const versions = await parser.use(source.type, source.params);

    let tags: Tag[] | null = null;
    if (tagsData) {
      tags = await this.tagService.getOrCreateTags(tagsData);
    }

    for (const version of versions) {
      await this.prismaService.gameVersion.upsert({
        where: {
          versionId: version.versionId,
        },
        create: {
          versionId: version.versionId,
          versionType: version.type,
          packageUrl: version.packageUrl,
          releasedAt: version.releasedAt,
          ...(tags
            ? {
                tags: {
                  create: tags.map((tag) => ({
                    tagId: tag.id,
                  })),
                },
              }
            : {}),
        },
        update: {
          packageUrl: version.packageUrl,
          releasedAt: version.releasedAt,
        },
      });
    }

    return {
      success: true,
    };
  }

  async getRelease(idOrVersionid: string): Promise<GameVersion | null> {
    const gameVersion = await this.prismaService.gameVersion.findFirst({
      where: {
        OR: [{ id: idOrVersionid }, { versionId: idOrVersionid }],
        versionType: GameVersionType.Release,
      },
    });

    return gameVersion;
  }

  async getRelaseOrThrow(
    idOrVersionid: string,
  ): Promise<GameVersionResponseDto> {
    const gameVersion = await this.getRelease(idOrVersionid);

    if (!gameVersion)
      throw new AppException(
        'Game version release does not exist',
        HttpStatus.NOT_FOUND,
      );

    return gameVersion;
  }
}
