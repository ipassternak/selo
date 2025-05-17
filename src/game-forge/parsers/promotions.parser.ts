import { HttpStatus } from '@nestjs/common';

import { AppException } from '@lib/utils/exception';
import { ApiService } from '@src/api/api.service';
import { ParseGameForgeUrlSourceParamsDto } from '@src/game-forge/dto/game-forge.dto';
import { GameForgePromotionsDto } from '@src/game-forge/dto/promotions.dto';

import { GameForgeBaseParser, GameForgeParseResult } from './base.parser';

export class GameForgePromotionsParser extends GameForgeBaseParser {
  constructor(private readonly apiService: ApiService) {
    super();
  }

  private map(
    versions: [string, string][],
    packageBaseUrl: string,
  ): GameForgeParseResult[] {
    const res = versions.map(
      ([promotionId, versionId]): GameForgeParseResult => {
        const gameVersionId = promotionId.replace(/[^.0-9]/g, '');
        return {
          versionId,
          gameVersionId,
          packageUrl: `${packageBaseUrl}/${gameVersionId}-${versionId}/forge-${gameVersionId}-${versionId}-installer.jar`,
        };
      },
    );

    return res;
  }

  async url(
    params: ParseGameForgeUrlSourceParamsDto,
  ): Promise<GameForgeParseResult[]> {
    const promotions = await this.apiService.makeHttpRequest(
      {
        url: params.url,
        cache: {
          ttlSec: 30,
          cacheKey: params.url,
        },
      },
      GameForgePromotionsDto,
    );

    const versions = Object.entries(promotions.promos);

    return this.map(versions, params.packageBaseUrl);
  }

  async file(): Promise<GameForgeParseResult[]> {
    throw new AppException(
      'Unsupported game forge promotions source parse type',
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
