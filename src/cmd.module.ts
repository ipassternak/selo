import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';

import { loadConfig } from '@lib/utils/config';
import { AppConfigDto } from 'config/app.dto';

import { CreateAdminCommand } from './cmd/create-admin.cmd';
import { EnableTaskCommand } from './cmd/enable-task.cmd';
import { DatabaseModule } from './database/database.module';
import { SchedulerService } from './scheduler/scheduler.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      isGlobal: true,
      load: [loadConfig('config.json', AppConfigDto)],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
        },
      },
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
  ],
  controllers: [],
  providers: [CreateAdminCommand, EnableTaskCommand, SchedulerService],
})
export class CmdModule {}
