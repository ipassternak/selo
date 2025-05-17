import {
  GameVersionParseSourceType,
  GameVersionType,
} from '@lib/types/game-version';

export interface GameVersionParseResult {
  versionId: string;
  type: GameVersionType;
  packageUrl: string;
  releasedAt: Date;
}

export abstract class GameVersionBaseParser {
  abstract url(params: unknown): Promise<GameVersionParseResult[]>;

  abstract file(params: unknown): Promise<GameVersionParseResult[]>;

  async use(
    type: GameVersionParseSourceType,
    params: unknown,
  ): Promise<GameVersionParseResult[]> {
    switch (type) {
      case GameVersionParseSourceType.Url:
        return await this.url(params);
      case GameVersionParseSourceType.File:
        return await this.file(params);
    }
  }
}
