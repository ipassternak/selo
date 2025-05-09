import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

import { ListResponseDto, PageableDto, ResponseDto } from '@lib/dto/lib.dto';
import { TagSortColumn, TagType } from '@lib/types/tag';

export class ListTagParamsDto extends PageableDto {
  @ApiProperty({ description: 'Search by tag name', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiProperty({ enum: TagSortColumn })
  @IsEnum(TagSortColumn)
  sortColumn: TagSortColumn = TagSortColumn.Name;

  @ApiProperty({ description: 'Tag type', enum: TagType })
  @IsEnum(TagType)
  type: TagType;
}

export class GetOrCreateTagDataDto {
  @ApiProperty({ description: 'Name of the tag to upsert', required: false })
  @IsString()
  @IsOptional()
  @Length(3, 32)
  name: string;
}

export class TagResponseDto extends ResponseDto {
  @ApiProperty({ description: 'Tag id' })
  id: string;

  @ApiProperty({ description: 'Tag name' })
  name: string;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
}

export class TagsResponseDto extends ResponseDto {
  @Exclude()
  tagId: string;

  @Exclude()
  gameVersionId?: string;

  @ApiProperty({ type: TagResponseDto })
  @Type(() => TagResponseDto)
  tag: TagResponseDto;
}

export class TagsListResponseDto extends ListResponseDto<TagResponseDto> {
  @ApiProperty({ type: [TagResponseDto] })
  @Type(() => TagResponseDto)
  data: TagResponseDto[];
}
