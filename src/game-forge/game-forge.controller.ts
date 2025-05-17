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
  CreateGameForgeDataDto,
  GameForgeListResponseDto,
  GameForgeResponseDto,
  ListGameForgeParamsDto,
  ParseGameForgeDataDto,
  UpdateGameForgeDataDto,
} from './dto/game-forge.dto';
import { GameForgeService } from './game-forge.service';

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('Game Forges')
@Controller('/api/game-forges')
export class GameForgeController {
  constructor(private readonly gameForgeService: GameForgeService) {}

  @Get('/')
  @SerializeOptions({ type: GameForgeListResponseDto })
  @ApiOperation({ description: 'List game forges' })
  @ApiOkResponse({ type: GameForgeListResponseDto })
  async list(
    @Query() params: ListGameForgeParamsDto,
  ): Promise<GameForgeListResponseDto> {
    return await this.gameForgeService.list(params);
  }

  @Get('/:id')
  @SerializeOptions({ type: GameForgeResponseDto })
  @ApiOperation({ description: 'Get game forge' })
  @ApiOkResponse({ type: GameForgeResponseDto })
  async get(@Param('id') id: string): Promise<GameForgeResponseDto> {
    return await this.gameForgeService.get(id);
  }

  @Post('/')
  @Roles({
    roleIds: [RoleId.Admin],
  })
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @SerializeOptions({ type: GameForgeResponseDto })
  @ApiOperation({ description: 'Create game forge' })
  @ApiCreatedResponse({ type: GameForgeResponseDto })
  async create(
    @Body() data: CreateGameForgeDataDto,
  ): Promise<GameForgeResponseDto> {
    return await this.gameForgeService.create(data);
  }

  @Put('/:id')
  @Roles({
    roleIds: [RoleId.Admin],
  })
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @SerializeOptions({ type: GameForgeResponseDto })
  @ApiOperation({ description: 'Update game forge' })
  @ApiOkResponse({ type: GameForgeResponseDto })
  async update(
    @Param('id') id: string,
    @Body() data: UpdateGameForgeDataDto,
  ): Promise<GameForgeResponseDto> {
    return await this.gameForgeService.update(id, data);
  }

  @Delete('/:id')
  @Roles({
    roleIds: [RoleId.Admin],
  })
  @HttpCode(204)
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ description: 'Delete game forge' })
  @ApiNoContentResponse({ description: 'Game forge deleted' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.gameForgeService.delete(id);
  }

  @Post('/parse')
  @Roles({
    roleIds: [RoleId.Admin],
  })
  @HttpCode(200)
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @SerializeOptions({ type: SuccessResponseDto })
  @ApiOperation({ description: 'Parse game forge' })
  @ApiOkResponse({ type: SuccessResponseDto })
  async parse(
    @Body() data: ParseGameForgeDataDto,
  ): Promise<SuccessResponseDto> {
    return await this.gameForgeService.parse(data);
  }
}
