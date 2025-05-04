import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { loadConfig } from '@lib/utils/config';
import { AppConfigDto } from 'config/app.dto';

import { CreateAdminCommand } from './cmd/create-admin.cmd';
import { DatabaseModule } from './database/database.module';

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
    DatabaseModule,
  ],
  controllers: [],
  providers: [CreateAdminCommand],
})
export class CmdModule {}
