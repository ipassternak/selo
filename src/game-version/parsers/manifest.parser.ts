import { HttpStatus } from '@nestjs/common';

import { AppException } from '@lib/utils/exception';
import { ApiService } from '@src/api/api.service';
import { ParseGameVersionUrlSourceParamsDto } from '@src/game-version/dto/game-version.dto';
import { GameVersionManifestDto } from '@src/game-version/dto/mainfest.dto';

import { GameVersionBaseParser, GameVersionParseResult } from './base.parser';

export class GameVersionManifestParser extends GameVersionBaseParser {
  constructor(private readonly apiService: ApiService) {
    super();
  }

  private map(manifest: GameVersionManifestDto): GameVersionParseResult[] {
    const res = manifest.versions.map(
      (version): GameVersionParseResult => ({
        versionId: version.id,
        type: version.type,
        packageUrl: version.url,
        releasedAt: version.releaseTime,
      }),
    );

    return res;
  }

  async url(
    params: ParseGameVersionUrlSourceParamsDto,
  ): Promise<GameVersionParseResult[]> {
    const manifest = await this.apiService.makeHttpRequest(
      {
        url: params.url,
        cache: {
          ttlSec: 30,
          cacheKey: params.url,
        },
      },
      GameVersionManifestDto,
    );

    return this.map(manifest);
  }

  async file(): Promise<GameVersionParseResult[]> {
    throw new AppException(
      'Unsupported game version manifest source parse type',
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
