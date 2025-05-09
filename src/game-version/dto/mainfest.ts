import { Type } from 'class-transformer';
import {
  Allow,
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import {
  GameVersionManifest,
  GameVersionManifestItem,
  GameVersionManifestLatest,
} from '@lib/types/game-version';

class GameVersionManifestItemDto implements GameVersionManifestItem {
  @IsString()
  @Length(1, 32)
  id: string;

  @IsString()
  @Length(1, 32)
  type: string;

  @IsString()
  @Length(1, 255)
  url: string;

  @IsDate()
  time: Date;

  @IsDate()
  releaseTime: Date;
}

export class GameVersionManifestDto implements GameVersionManifest {
  @Allow()
  latest: GameVersionManifestLatest;

  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => GameVersionManifestItemDto)
  versions: GameVersionManifestItemDto[];
}
