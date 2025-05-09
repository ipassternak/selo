import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Query,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ListTagParamsDto, TagsListResponseDto } from './dto/tag.dto';
import { TagService } from './tag.service';

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('Tags')
@Controller('/api/tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get('/')
  @SerializeOptions({ type: TagsListResponseDto })
  @ApiOperation({ description: 'List tags' })
  @ApiOkResponse({ type: TagsListResponseDto })
  async list(@Query() params: ListTagParamsDto): Promise<TagsListResponseDto> {
    return await this.tagService.list(params);
  }
}
