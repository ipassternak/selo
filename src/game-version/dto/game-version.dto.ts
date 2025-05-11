import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
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
import { ListResponseDto, PageableDto, ResponseDto } from '@lib/dto/lib.dto';
import {
  GameVersionParseSourceType,
  GameVersionParseType,
  GameVersionSortColumn,
  GameVersionType,
} from '@lib/types/game-version';
import { GetOrCreateTagDataDto, TagsResponseDto } from '@src/tag/dto/tag.dto';
import { TagConfig } from '@src/tag/tag.config';

export class ListGameVersionParamsDto extends PageableDto {
  @ApiProperty({ enum: GameVersionSortColumn })
  @IsEnum(GameVersionSortColumn)
  sortColumn: GameVersionSortColumn = GameVersionSortColumn.ReleasedAt;

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
    enum: GameVersionType,
    description: 'Version type',
    required: false,
  })
  @IsOptional()
  @IsEnum(GameVersionType)
  versionType?: GameVersionType;
}

export class CreateGameVersionDataDto {
  @ApiProperty({ description: 'Unique version identifier' })
  @IsString()
  @Length(1, 32)
  versionId: string;

  @ApiProperty({ enum: GameVersionParseType, description: 'Version type' })
  @IsEnum(GameVersionParseType)
  versionType: GameVersionParseType;

  @ApiProperty({ description: 'Version package url' })
  @IsString()
  @MaxLength(255)
  packageUrl: string;

  @ApiProperty({ description: 'Version release date' })
  @IsDate()
  releasedAt: Date;

  @ApiProperty({ type: [GetOrCreateTagDataDto] })
  @IsArray()
  @ArrayMaxSize(TagConfig.limit)
  @ValidateNested({ each: true })
  @Type(() => GetOrCreateTagDataDto)
  tags: [];
}

export class UpdateGameVersionDataDto {
  @IsOptional()
  @ApiProperty({ description: 'Unique version identifier', required: false })
  @IsString()
  @Length(1, 32)
  versionId?: string;

  @IsOptional()
  @ApiProperty({ description: 'Version package url', required: false })
  @IsString()
  @MaxLength(255)
  packageUrl?: string;

  @IsOptional()
  @ApiProperty({ description: 'Version release date', required: false })
  @IsDate()
  releasedAt?: Date;

  @IsOptional()
  @ApiProperty({ type: [GetOrCreateTagDataDto], required: false })
  @IsArray()
  @ArrayMaxSize(TagConfig.limit)
  @ValidateNested({ each: true })
  @Type(() => GetOrCreateTagDataDto)
  tags?: GetOrCreateTagDataDto[];
}

export class ParseGameVersionUrlSourceParams {
  @IsString()
  @MaxLength(255)
  url: string;
}

export class ParseGameVersionFileSourceParams {
  @IsString()
  @IsNotEmpty()
  fileId: string;
}

class ParseGameVersionSourceDataDto {
  @ApiProperty({ enum: GameVersionParseSourceType, description: 'Source type' })
  @IsEnum(GameVersionParseSourceType)
  type: GameVersionParseSourceType;

  @ApiProperty({ description: 'Params of the source', type: Object })
  @ValidateStrategy<{ type: GameVersionParseSourceType }>(({ type }) => {
    switch (type) {
      case GameVersionParseSourceType.Url:
        return ParseGameVersionUrlSourceParams;
      case GameVersionParseSourceType.File:
        return ParseGameVersionFileSourceParams;
    }
  })
  params: unknown;
}

export class ParseGameVersionDataDto {
  @ApiProperty({ enum: GameVersionParseType, description: 'Parse type' })
  @IsEnum(GameVersionParseType)
  type: GameVersionParseType;

  @IsOptional()
  @ApiProperty({
    type: [GetOrCreateTagDataDto],
    required: false,
    description: 'Tags to apply to new versions',
  })
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => GetOrCreateTagDataDto)
  tags?: GetOrCreateTagDataDto[];

  @ApiProperty({ type: ParseGameVersionSourceDataDto })
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ParseGameVersionSourceDataDto)
  source: ParseGameVersionSourceDataDto;
}

export class GameVersionResponseDto extends ResponseDto {
  @ApiProperty({ description: 'Record id' })
  id: string;

  @ApiProperty({ description: 'Original version id' })
  versionId: string;

  @ApiProperty({ description: 'Package url' })
  packageUrl: string;

  @ApiProperty({ description: 'Release date' })
  releasedAt: Date;

  @ApiProperty({ description: 'Create date' })
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @ApiProperty({ description: 'Version tags', type: [TagsResponseDto] })
  @Type(() => TagsResponseDto)
  tags: TagsResponseDto[];
}

// eslint-disable-next-line max-len
export class GameVersionListResponseDto extends ListResponseDto<GameVersionResponseDto> {
  @ApiProperty({ type: [GameVersionResponseDto] })
  @Type(() => GameVersionResponseDto)
  data: GameVersionResponseDto[];
}
