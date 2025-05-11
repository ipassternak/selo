import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma, Tag } from '@prisma/client';

import { SuccessResponseDto } from '@lib/dto/lib.dto';
import { GameVersionParseSourceType } from '@lib/types/game-version';
import { AppException, createAppException } from '@lib/utils/exception';
import { ApiService } from '@src/api/api.service';
import { PrismaService } from '@src/database/prisma.service';
import { TagConfig } from '@src/tag/tag.config';
import { TagService } from '@src/tag/tag.service';

import {
  CreateGameVersionDataDto,
  GameVersionListResponseDto,
  GameVersionResponseDto,
  ListGameVersionParamsDto,
  ParseGameVersionDataDto,
  ParseGameVersionUrlSourceParams,
  UpdateGameVersionDataDto,
} from './dto/game-version.dto';
import { GameVersionManifestDto } from './dto/mainfest';

const AlreadyExistsException = createAppException(
  'Game version already exists',
  HttpStatus.CONFLICT,
  'GV_ERR_ALREADY_EXISTS',
);

@Injectable()
export class GameVersionService {
  private readonly logger = new Logger(GameVersionService.name);

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
        orderBy: {
          [sortColumn]: sortOrder,
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
            take: TagConfig.limit,
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
          take: TagConfig.limit,
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

  async checkUniqueVersionId(versionId: string): Promise<void> {
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

    const tags = await this.tagService.getOrCreateTags(tagsData);

    const gameVersion = await this.prismaService.gameVersion.create({
      data: {
        versionId,
        versionType,
        packageUrl,
        releasedAt,
        tags: {
          create: tags.map((tag) => ({
            tagId: tag.id,
          })),
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
          take: TagConfig.limit,
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
                    gameVersion.tags.every(
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
          take: TagConfig.limit,
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
    const { tags: tagsData, source } = data;

    let tags: Tag[] | null = null;
    if (tagsData) {
      tags = await this.tagService.getOrCreateTags(tagsData);
    }

    if (source.type !== GameVersionParseSourceType.Url)
      throw new AppException(
        'Unsupported source type',
        HttpStatus.NOT_IMPLEMENTED,
      );

    const sourceParams = <ParseGameVersionUrlSourceParams>source.params;

    const manifest = await this.apiService.makeHttpRequest(
      {
        url: sourceParams.url,
        cache: {
          ttlSec: 30,
          cacheKey: sourceParams.url,
        },
      },
      GameVersionManifestDto,
    );

    this.logger.debug({
      message: 'Parsed game version manifest',
      urL: sourceParams.url,
      leatest: manifest.latest,
      versions: {
        count: manifest.versions.length,
        head: manifest.versions.slice(0, 10),
      },
    });

    for (const version of manifest.versions) {
      await this.prismaService.gameVersion.upsert({
        where: {
          versionId: version.id,
        },
        create: {
          versionId: version.id,
          versionType: version.type,
          packageUrl: version.url,
          releasedAt: version.releaseTime,
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
          packageUrl: version.url,
          releasedAt: version.releaseTime,
        },
      });
    }

    return {
      success: true,
    };
  }
}
