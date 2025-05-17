import { Type } from 'class-transformer';
import {
  Allow,
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsEnum,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import {
  GameVersionManifest,
  GameVersionManifestItem,
  GameVersionManifestLatest,
  GameVersionType,
} from '@lib/types/game-version';

class GameVersionManifestItemDto implements GameVersionManifestItem {
  @IsString()
  @Length(1, 32)
  id: string;

  @IsEnum(GameVersionType)
  type: GameVersionType;

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
