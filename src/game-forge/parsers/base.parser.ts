import { GameForgeParseSourceType } from '@lib/types/game-forge';

export interface GameForgeParseResult {
  versionId: string;
  gameVersionId: string;
  packageUrl: string;
}

export abstract class GameForgeBaseParser {
  abstract url(params: unknown): Promise<GameForgeParseResult[]>;

  abstract file(params: unknown): Promise<GameForgeParseResult[]>;

  async use(
    type: GameForgeParseSourceType,
    params: unknown,
  ): Promise<GameForgeParseResult[]> {
    switch (type) {
      case GameForgeParseSourceType.Url:
        return await this.url(params);
      case GameForgeParseSourceType.File:
        return await this.file(params);
    }
  }
}
