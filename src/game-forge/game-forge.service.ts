import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma, Tag } from '@prisma/client';

import { SuccessResponseDto } from '@lib/dto/lib.dto';
import { GameForgeParseSourceType } from '@lib/types/game-forge';
import { AppException, createAppException } from '@lib/utils/exception';
import { sortBy } from '@lib/utils/query';
import { ApiService } from '@src/api/api.service';
import { PrismaService } from '@src/database/prisma.service';
import { GameVersionService } from '@src/game-version/game-version.service';
import { TagService } from '@src/tag/tag.service';

import {
  CreateGameForgeDataDto,
  GameForgeListResponseDto,
  GameForgeResponseDto,
  ListGameForgeParamsDto,
  ParseGameForgeDataDto,
  ParseGameForgeUrlSourceParamsDto,
  UpdateGameForgeDataDto,
} from './dto/game-forge.dto';
import { GameForgePromotionsDto } from './dto/promotions.dto';

const AlreadyExistsException = createAppException(
  'Game forge already exists',
  HttpStatus.CONFLICT,
  'GF_ERR_ALREADY_EXISTS',
);

@Injectable()
export class GameForgeService {
  private readonly logger = new Logger(GameForgeService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly tagService: TagService,
    private readonly apiService: ApiService,
    private readonly gameVersionService: GameVersionService,
  ) {}

  async list(
    params: ListGameForgeParamsDto,
  ): Promise<GameForgeListResponseDto> {
    const {
      page,
      pageSize,
      sortColumn,
      sortOrder,
      tagNames,
      versionId,
      gameVersionId,
    } = params;

    const where: Prisma.GameForgeWhereInput = {
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
      ...(gameVersionId
        ? {
            gameVersion: {
              OR: [
                { id: { contains: gameVersionId, mode: 'insensitive' } },
                { versionId: { contains: gameVersionId, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prismaService.gameForge.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: sortBy(sortColumn, sortOrder),
        include: {
          gameVersion: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      this.prismaService.gameForge.count({
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

  async get(id: string): Promise<GameForgeResponseDto> {
    const gameForge = await this.prismaService.gameForge.findUnique({
      where: {
        id,
      },
      include: {
        gameVersion: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!gameForge)
      throw new AppException('Game forge does not exist', HttpStatus.NOT_FOUND);

    return gameForge;
  }

  private async checkUniqueVersionId(versionId: string): Promise<void> {
    const gameVersion = await this.prismaService.gameForge.findUnique({
      where: {
        versionId,
      },
    });

    if (gameVersion) throw new AlreadyExistsException();
  }

  async create(data: CreateGameForgeDataDto): Promise<GameForgeResponseDto> {
    const { versionId, gameVersionId, packageUrl, tags: tagsData } = data;

    await this.checkUniqueVersionId(versionId);

    const gameVersion =
      await this.gameVersionService.getRelaseOrThrow(gameVersionId);

    let tags: Tag[] | null = null;
    if (tagsData) {
      tags = await this.tagService.getOrCreateTags(tagsData);
    }

    const gameForge = await this.prismaService.gameForge.create({
      data: {
        versionId,
        gameVersionId: gameVersion.id,
        packageUrl,
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
        gameVersion: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return gameForge;
  }

  async update(
    id: string,
    data: UpdateGameForgeDataDto,
  ): Promise<GameForgeResponseDto> {
    const { versionId, packageUrl, tags: tagsData } = data;

    const gameForge = await this.get(id);

    let tags: Tag[] | null = null;

    if (tagsData) {
      tags = await this.tagService.getOrCreateTags(tagsData);
    }

    const updatedGameForge = await this.prismaService.gameForge.update({
      where: {
        id: gameForge.id,
      },
      data: {
        versionId: versionId ?? gameForge.versionId,
        packageUrl: packageUrl ?? gameForge.packageUrl,
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
                    gameForge.tags?.every(
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
        gameVersion: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return updatedGameForge;
  }

  async delete(id: string): Promise<void> {
    await this.prismaService.gameForge
      .delete({
        where: {
          id,
        },
      })
      .catch((err: unknown) => {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          if (err.code === 'P2025')
            throw new AppException(
              'Game forge does not exist',
              HttpStatus.NOT_FOUND,
            );
        }

        throw new AppException(
          'Failed to delete game forge',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  async parse(data: ParseGameForgeDataDto): Promise<SuccessResponseDto> {
    const { tags: tagsData, source } = data;

    let tags: Tag[] | null = null;
    if (tagsData) {
      tags = await this.tagService.getOrCreateTags(tagsData);
    }

    if (source.type !== GameForgeParseSourceType.Url)
      throw new AppException(
        'Unsupported source type',
        HttpStatus.NOT_IMPLEMENTED,
      );

    const sourceParams = <ParseGameForgeUrlSourceParamsDto>source.params;

    const promotions = await this.apiService.makeHttpRequest(
      {
        url: sourceParams.url,
        cache: {
          ttlSec: 30,
          cacheKey: sourceParams.url,
        },
      },
      GameForgePromotionsDto,
    );

    const versions = Object.entries(promotions.promos);

    this.logger.debug({
      message: 'Parsed game forge promotions',
      urL: sourceParams.url,
      versions: {
        count: versions.length,
        head: versions.slice(0, 10),
      },
    });

    for (const [promotionId, versionId] of versions) {
      const gameVersionId = promotionId.replace(/[^.0-9]/g, '');
      const gameVersion =
        await this.gameVersionService.getRelease(gameVersionId);

      if (!gameVersion) continue;

      const packageUrl = `${sourceParams.packageBaseUrl}/${gameVersionId}-${versionId}/forge-${gameVersionId}-${versionId}-installer.jar`;

      await this.prismaService.gameForge.upsert({
        where: {
          versionId,
        },
        create: {
          versionId,
          gameVersionId: gameVersion.id,
          packageUrl,
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
          packageUrl,
        },
      });
    }

    return {
      success: true,
    };
  }
}
