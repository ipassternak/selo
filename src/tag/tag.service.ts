import { Injectable } from '@nestjs/common';
import { Prisma, Tag } from '@prisma/client';

import { PrismaService } from '@src/database/prisma.service';

import {
  GetOrCreateTagDataDto,
  ListTagParamsDto,
  TagsListResponseDto,
} from './dto/tag.dto';

@Injectable()
export class TagService {
  constructor(private readonly prismaService: PrismaService) {}

  async list(params: ListTagParamsDto): Promise<TagsListResponseDto> {
    const { page, pageSize, sortColumn, sortOrder, name, type } = params;

    const where: Prisma.TagWhereInput = {
      [type]: {
        every: {
          tagId: {},
        },
      },
      name: {
        contains: name,
        mode: 'insensitive',
      },
    };

    const [data, total] = await Promise.all([
      this.prismaService.tag.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: {
          [sortColumn]: sortOrder,
        },
      }),
      this.prismaService.tag.count({
        where,
      }),
    ]);

    return {
      data,
      meta: {
        total,
      },
    };
  }

  async getOrCreateTags(data: GetOrCreateTagDataDto[]): Promise<Tag[]> {
    const tags: Tag[] = [];

    for (const item of data) {
      let tag = await this.prismaService.tag.findUnique({
        where: {
          name: item.name,
        },
      });

      tag ??= await this.prismaService.tag.create({
        data: {
          name: item.name,
        },
      });

      tags.push(tag);
    }

    return tags;
  }
}
