import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { SuccessResponseDto } from '@lib/dto/lib.dto';
import { Roles } from '@lib/guards/roles.guard';
import { RoleId } from '@lib/types/user';
import { JwtAccessGuard } from '@src/auth/guards/jwt-access.guard';

import {
  CreateGameVersionDataDto,
  GameVersionListResponseDto,
  GameVersionResponseDto,
  ListGameVersionParamsDto,
  ParseGameVersionDataDto,
  UpdateGameVersionDataDto,
} from './dto/game-version.dto';
import { GameVersionService } from './game-version.service';

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('Game Versions')
@Controller('/api/game-versions')
export class GameVersionController {
  constructor(private readonly gameVersionService: GameVersionService) {}

  @Get('/')
  @SerializeOptions({ type: GameVersionListResponseDto })
  @ApiOperation({ description: 'List game versions' })
  @ApiOkResponse({ type: GameVersionListResponseDto })
  async list(
    @Query() params: ListGameVersionParamsDto,
  ): Promise<GameVersionListResponseDto> {
    return await this.gameVersionService.list(params);
  }

  @Get('/:id')
  @SerializeOptions({ type: GameVersionResponseDto })
  @ApiOperation({ description: 'Get game version' })
  @ApiOkResponse({ type: GameVersionResponseDto })
  async get(@Param('id') id: string): Promise<GameVersionResponseDto> {
    return await this.gameVersionService.get(id);
  }

  @Post('/')
  @Roles({
    roleIds: [RoleId.Admin],
  })
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @SerializeOptions({ type: GameVersionResponseDto })
  @ApiOperation({ description: 'Create game version' })
  @ApiCreatedResponse({ type: GameVersionResponseDto })
  async create(
    @Body() data: CreateGameVersionDataDto,
  ): Promise<GameVersionResponseDto> {
    return await this.gameVersionService.create(data);
  }

  @Put('/:id')
  @Roles({
    roleIds: [RoleId.Admin],
  })
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @SerializeOptions({ type: GameVersionResponseDto })
  @ApiOperation({ description: 'Update game version' })
  @ApiOkResponse({ type: GameVersionResponseDto })
  async update(
    @Param('id') id: string,
    @Body() data: UpdateGameVersionDataDto,
  ): Promise<GameVersionResponseDto> {
    return await this.gameVersionService.update(id, data);
  }

  @Delete('/:id')
  @Roles({
    roleIds: [RoleId.Admin],
  })
  @HttpCode(204)
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ description: 'Delete game version' })
  @ApiNoContentResponse({ description: 'Game version deleted' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.gameVersionService.delete(id);
  }

  @Post('/parse')
  @Roles({
    roleIds: [RoleId.Admin],
  })
  @HttpCode(200)
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @SerializeOptions({ type: SuccessResponseDto })
  @ApiOperation({ description: 'Parse game version' })
  @ApiOkResponse({ type: SuccessResponseDto })
  async parse(
    @Body() data: ParseGameVersionDataDto,
  ): Promise<SuccessResponseDto> {
    return await this.gameVersionService.parse(data);
  }
}
