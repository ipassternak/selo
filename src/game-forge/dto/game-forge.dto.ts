import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { ValidateStrategy } from '@lib/decorators/validate-strategy';
import { ListResponseDto, PageableDto } from '@lib/dto/lib.dto';
import {
  GameForgeParseSourceType,
  GameForgeParseType,
  GameForgeSortColumn,
} from '@lib/types/game-forge';
import { GameVersionResponseDto } from '@src/game-version/dto/game-version.dto';
import { GetOrCreateTagDataDto, TagsResponseDto } from '@src/tag/dto/tag.dto';
import { TagConfig } from '@src/tag/tag.config';

export class ListGameForgeParamsDto extends PageableDto {
  @ApiProperty({
    enum: GameForgeSortColumn,
    default: GameForgeSortColumn.GameVersionReleasedAt,
  })
  @IsEnum(GameForgeSortColumn)
  sortColumn: GameForgeSortColumn = GameForgeSortColumn.GameVersionReleasedAt;

  @Transform(({ value }): string[] | undefined => {
    if (typeof value === 'string') return value.split(',');
  })
  @ApiProperty({
    description: 'Comma separated list of tag names',
    required: false,
    type: String,
    isArray: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagNames?: string[];

  @ApiProperty({ description: 'Search by version id', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  versionId?: string;

  @ApiProperty({
    description: 'Search by game record or version id',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  gameVersionId?: string;
}

export class CreateGameForgeDataDto {
  @ApiProperty({ description: 'Unique version identifier' })
  @IsString()
  @Length(1, 32)
  versionId: string;

  @ApiProperty({ description: 'Game version record or version id' })
  @IsString()
  @IsNotEmpty()
  gameVersionId: string;

  @ApiProperty({ description: 'Forge package url' })
  @IsString()
  @MaxLength(255)
  packageUrl: string;

  @ApiProperty({ type: [GetOrCreateTagDataDto], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(TagConfig.limit)
  @ValidateNested({ each: true })
  @Type(() => GetOrCreateTagDataDto)
  tags?: [];
}

export class UpdateGameForgeDataDto {
  @IsOptional()
  @ApiProperty({ description: 'Unique version identifier', required: false })
  @IsString()
  @Length(1, 32)
  versionId?: string;

  @IsOptional()
  @ApiProperty({ description: 'Forge package url', required: false })
  @IsString()
  @MaxLength(255)
  packageUrl?: string;

  @IsOptional()
  @ApiProperty({ type: [GetOrCreateTagDataDto], required: false })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(TagConfig.limit)
  @ValidateNested({ each: true })
  @Type(() => GetOrCreateTagDataDto)
  tags?: GetOrCreateTagDataDto[];
}

export class ParseGameForgeUrlSourceParamsDto {
  @IsString()
  @MaxLength(255)
  url: string;

  @IsString()
  @MaxLength(255)
  packageBaseUrl: string;
}

export class ParseGameForgeFileSourceParamsDto {
  @IsString()
  @IsNotEmpty()
  fileId: string;
}

class ParseGameForgeSourceDataDto {
  @ApiProperty({ enum: GameForgeParseSourceType, description: 'Source type' })
  @IsEnum(GameForgeParseSourceType)
  type: GameForgeParseSourceType;

  @ApiProperty({ description: 'Params of the source', type: Object })
  @ValidateStrategy<{ type: GameForgeParseSourceType }>(({ type }) => {
    switch (type) {
      case GameForgeParseSourceType.Url:
        return ParseGameForgeUrlSourceParamsDto;
      case GameForgeParseSourceType.File:
        return ParseGameForgeFileSourceParamsDto;
    }
  })
  params: unknown;
}

export class ParseGameForgeDataDto {
  @ApiProperty({ enum: GameForgeParseType, description: 'Parse type' })
  @IsEnum(GameForgeParseType)
  type: GameForgeParseType;

  @IsOptional()
  @ApiProperty({
    type: [GetOrCreateTagDataDto],
    required: false,
    description: 'Tags to apply to new forges',
  })
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => GetOrCreateTagDataDto)
  tags?: GetOrCreateTagDataDto[];

  @ApiProperty({ type: ParseGameForgeSourceDataDto })
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ParseGameForgeSourceDataDto)
  source: ParseGameForgeSourceDataDto;
}

export class GameForgeResponseDto {
  @ApiProperty({ description: 'Record id' })
  id: string;

  @ApiProperty({ description: 'Original version id' })
  versionId: string;

  @Exclude()
  gameVersionId: string;

  @ApiProperty({ type: GameVersionResponseDto })
  @Type(() => GameVersionResponseDto)
  gameVersion: GameVersionResponseDto;

  @ApiProperty({ description: 'Package url' })
  packageUrl: string;

  @ApiProperty({ description: 'Create date' })
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @ApiProperty({
    description: 'Forge tags',
    type: [TagsResponseDto],
    required: false,
  })
  @Type(() => TagsResponseDto)
  tags?: TagsResponseDto[];
}

// eslint-disable-next-line max-len
export class GameForgeListResponseDto extends ListResponseDto<GameForgeResponseDto> {
  @ApiProperty({ type: [GameForgeResponseDto] })
  @Type(() => GameForgeResponseDto)
  data: GameForgeResponseDto[];
}
