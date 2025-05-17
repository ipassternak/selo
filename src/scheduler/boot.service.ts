import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppConfigDto } from '@config/app.dto';
import {
  GameForgeParseSourceType,
  GameForgeParseType,
} from '@lib/types/game-forge';
import {
  GameVersionParseSourceType,
  GameVersionParseType,
} from '@lib/types/game-version';
import { AuthService } from '@src/auth/auth.service';
import { ParseGameForgeUrlSourceParamsDto } from '@src/game-forge/dto/game-forge.dto';
import { GameForgeService } from '@src/game-forge/game-forge.service';
import { ParseGameVersionUrlSourceParamsDto } from '@src/game-version/dto/game-version.dto';
import { GameVersionService } from '@src/game-version/game-version.service';

import { SchedulerService } from './scheduler.service';

@Injectable()
export class BootService implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService<AppConfigDto, true>,
    private readonly schedulerService: SchedulerService,
    private readonly authService: AuthService,
    private readonly gameVersionService: GameVersionService,
    private readonly gameForgeService: GameForgeService,
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
      configDto: ParseGameVersionUrlSourceParamsDto,
      handler: async (config) => {
        await this.gameVersionService.parse({
          type: GameVersionParseType.Manifest,
          source: {
            type: GameVersionParseSourceType.Url,
            params: config,
          },
        });
      },
    });

    await this.schedulerService.scheduleTask({
      name: 'parseGameForges',
      configDto: ParseGameForgeUrlSourceParamsDto,
      handler: async (config) => {
        await this.gameForgeService.parse({
          type: GameForgeParseType.Promotions,
          source: {
            type: GameForgeParseSourceType.Url,
            params: config,
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
