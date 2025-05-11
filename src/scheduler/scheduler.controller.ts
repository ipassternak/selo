import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Query,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { SuccessResponseDto } from '@lib/dto/lib.dto';
import { Roles } from '@lib/guards/roles.guard';
import { RoleId } from '@lib/types/user';
import { JwtAccessGuard } from '@src/auth/guards/jwt-access.guard';

import {
  DisableTaskDataDto,
  EnableTaskDataDto,
  ListTaskParamsDto,
  TaskListResponseDto,
} from './dto/scheduler';
import { SchedulerService } from './scheduler.service';

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('Tasks')
@Controller('/api/tasks')
@ApiBearerAuth()
@Roles({
  roleIds: [RoleId.Admin],
})
@UseGuards(JwtAccessGuard)
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get('/')
  @ApiOperation({
    description: 'List all scheduled tasks',
  })
  @SerializeOptions({ type: TaskListResponseDto })
  @ApiOkResponse({ type: TaskListResponseDto })
  async listTasks(
    @Query() params: ListTaskParamsDto,
  ): Promise<TaskListResponseDto> {
    return await this.schedulerService.listTasks(params);
  }

  @Post('/enable')
  @ApiOperation({
    description: 'Enable scheduled task',
  })
  @SerializeOptions({ type: SuccessResponseDto })
  @ApiOkResponse({ type: SuccessResponseDto })
  async enableTask(
    @Body() data: EnableTaskDataDto,
  ): Promise<SuccessResponseDto> {
    return await this.schedulerService.enableTask(data);
  }

  @Post('/disable')
  @ApiOperation({
    description: 'Disable scheduled task',
  })
  @SerializeOptions({ type: SuccessResponseDto })
  @ApiOkResponse({ type: SuccessResponseDto })
  async disableTask(
    @Body() data: DisableTaskDataDto,
  ): Promise<SuccessResponseDto> {
    return await this.schedulerService.disableTask(data);
  }
}
