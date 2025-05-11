import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppConfigDto } from '@config/app.dto';
import {
  GameVersionParseSourceType,
  GameVersionParseType,
} from '@lib/types/game-version';
import { AuthService } from '@src/auth/auth.service';
import { GameVersionService } from '@src/game-version/game-version.service';

import { ParseGameVersionsConfigDto } from './dto/task';
import { SchedulerService } from './scheduler.service';

@Injectable()
export class BootService implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService<AppConfigDto, true>,
    private readonly schedulerService: SchedulerService,
    private readonly authService: AuthService,
    private readonly gameVersionService: GameVersionService,
  ) {}

  private async scheduleJobs(): Promise<void> {
    this.schedulerService.scheduleJob({
      name: 'authCleanupSessions',
      cron: this.configService.get('scheduler.authCleanupSessions', {
        infer: true,
      }),
      handler: async () => {
        await this.authService.cleanupSessions();
      },
    });
  }

  private async scheduleTasks(): Promise<void> {
    await this.schedulerService.scheduleTask({
      name: 'parseGameVersions',
      configDto: ParseGameVersionsConfigDto,
      handler: async (config) => {
        await this.gameVersionService.parse({
          type: GameVersionParseType.Manifest,
          source: {
            type: GameVersionParseSourceType.Url,
            params: {
              url: config.url,
            },
          },
        });
      },
    });
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.scheduleJobs();
    await this.scheduleTasks();
  }
}
