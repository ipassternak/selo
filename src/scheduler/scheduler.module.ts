import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from '@src/auth/auth.module';
import { GameVersionModule } from '@src/game-version/game-version.module';

import { BootService } from './boot.service';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule, GameVersionModule],
  controllers: [SchedulerController],
  providers: [SchedulerService, BootService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
