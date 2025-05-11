import { HttpStatus, Injectable, Logger, Type } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Prisma, Task } from '@prisma/client';
import { CronJob } from 'cron';

import { SuccessResponseDto } from '@lib/dto/lib.dto';
import { AppException } from '@lib/utils/exception';
import { validate } from '@lib/utils/validate';
import { PrismaService } from '@src/database/prisma.service';

import {
  DisableTaskDataDto,
  EnableTaskDataDto,
  ListTaskParamsDto,
  TaskListResponseDto,
  TaskResponseDto,
} from './dto/scheduler';

type JobHandler = () => Promise<void>;
type TaskHandler<T = unknown> = (config: T, task: Task) => Promise<void>;

interface TaskRegistryRecord {
  handler: TaskHandler;
  configDto?: Type<unknown>;
}

export interface ScheduleJobOptions {
  name: string;
  cron: string;
  handler: JobHandler;
}

export interface ScheduleTaskOptions<T = unknown> {
  name: string;
  handler: TaskHandler<T>;
  configDto?: Type<T>;
}

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  private readonly taskRegistry = new Map<string, TaskRegistryRecord>();

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly prismaService: PrismaService,
  ) {}

  private upsertJob(name: string, cron: string, handler: JobHandler): CronJob {
    const job = new CronJob(cron, async () => {
      try {
        this.logger.debug({
          service: `${SchedulerService.name}.${name}`,
          job: name,
          message: 'Executing scheduled job',
        });
        await handler();
      } catch (error: unknown) {
        this.logger.error({
          service: `${SchedulerService.name}.${name}`,
          job: name,
          message: 'Error occurred during scheduled job execution',
          error:
            error instanceof Error
              ? { ...error, message: error.message }
              : error,
        });
      }
    });

    const cronJobName = `job:${name}`;
    if (this.schedulerRegistry.doesExist('cron', cronJobName))
      this.schedulerRegistry.deleteCronJob(cronJobName);
    this.schedulerRegistry.addCronJob(cronJobName, job);
    job.start();
    return job;
  }

  private upsertTask(
    name: string,
    cron: string,
    handler: TaskHandler,
  ): CronJob {
    const job = new CronJob(cron, async () => {
      try {
        this.logger.debug({
          service: `${SchedulerService.name}.${name}`,
          job: name,
          message: 'Executing scheduled task',
        });
        const task = await this.prismaService.task.findUniqueOrThrow({
          where: { name },
        });
        if (!task.isEnabled) {
          this.logger.warn({
            service: `${SchedulerService.name}.${name}`,
            job: name,
            message: 'Task is disabled, skipping execution',
          });
          return;
        }
        await handler(task.config, task);
      } catch (error: unknown) {
        this.logger.error({
          service: `${SchedulerService.name}.${name}`,
          job: name,
          message: 'Error occurred during scheduled task execution',
          error:
            error instanceof Error
              ? { ...error, message: error.message }
              : error,
        });
      }
    });

    const cronJobName = `task:${name}`;
    if (this.schedulerRegistry.doesExist('cron', cronJobName))
      this.schedulerRegistry.deleteCronJob(cronJobName);
    this.schedulerRegistry.addCronJob(cronJobName, job);
    job.start();
    return job;
  }

  scheduleJob({ name, cron, handler }: ScheduleJobOptions): void {
    this.upsertJob(name, cron, handler);
  }

  private async bootTask(
    { name, handler, configDto }: ScheduleTaskOptions,
    task: Task,
  ): Promise<void> {
    if (!task.isEnabled) {
      return;
    }

    if (task.cron) {
      if (configDto) {
        const [errors] = await validate(<Type<object>>configDto, task.config);

        if (!errors) return void this.upsertTask(name, task.cron, handler);
      }
    }

    await this.prismaService.task.update({
      where: { name },
      data: {
        isEnabled: false,
      },
    });
  }

  async scheduleTask<T>({
    name,
    handler,
    configDto,
  }: ScheduleTaskOptions<T>): Promise<void> {
    this.taskRegistry.set(name, { handler, configDto });

    const existingTask = await this.prismaService.task.findUnique({
      where: { name },
    });

    if (!existingTask) {
      await this.prismaService.task.create({
        data: { name, isEnabled: false },
      });
    } else {
      await this.bootTask({ name, handler, configDto }, existingTask);
    }
  }

  async enableTask(data: EnableTaskDataDto): Promise<SuccessResponseDto> {
    const { name, cron, config } = data;

    const taskRegistryRecord = this.taskRegistry.get(name);

    if (!taskRegistryRecord)
      throw new AppException(
        'Task handler does not exist',
        HttpStatus.NOT_FOUND,
        null,
      );

    const task = await this.prismaService.task.findUniqueOrThrow({
      where: { name },
    });

    task.cron = cron ?? task.cron;

    if (!task.cron)
      throw new AppException(
        'Task cron expression is required',
        HttpStatus.BAD_REQUEST,
        null,
      );

    if (taskRegistryRecord.configDto) {
      const [errors] = await validate(
        <Type<object>>taskRegistryRecord.configDto,
        config,
        {
          forbidNonWhitelisted: true,
        },
      );

      if (errors) {
        throw new AppException(
          'Invalid task configuration',
          HttpStatus.BAD_REQUEST,
          null,
          errors,
        );
      }

      task.config = <Prisma.JsonValue>config ?? task.config;
    }

    await this.prismaService.task.update({
      where: { name },
      data: {
        isEnabled: true,
        cron: task.cron,
        config: <Prisma.InputJsonValue>task.config,
      },
    });

    this.upsertTask(name, task.cron, taskRegistryRecord.handler);

    return {
      success: true,
    };
  }

  async disableTask(data: DisableTaskDataDto): Promise<SuccessResponseDto> {
    const { name } = data;

    const taskRegistryRecord = this.taskRegistry.get(name);

    if (!taskRegistryRecord)
      throw new AppException(
        'Task handler does not exist',
        HttpStatus.NOT_FOUND,
        null,
      );

    await this.prismaService.task.update({
      where: { name },
      data: {
        isEnabled: false,
      },
    });

    const cronJobName = `task:${name}`;

    if (this.schedulerRegistry.doesExist('cron', cronJobName))
      this.schedulerRegistry.deleteCronJob(cronJobName);

    return {
      success: true,
    };
  }

  async listTasks(params: ListTaskParamsDto): Promise<TaskListResponseDto> {
    const { name, isEnabled } = params;

    const where: Prisma.TaskWhereInput = {
      name,
      isEnabled,
    };

    const [data, total] = await Promise.all([
      this.prismaService.task.findMany({
        where,
        orderBy: { name: 'asc' },
      }),
      this.prismaService.task.count({
        where,
      }),
    ]);

    return {
      data: <TaskResponseDto[]>data,
      meta: {
        total,
      },
    };
  }
}
