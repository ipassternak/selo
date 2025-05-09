import { Module } from '@nestjs/common';

import { ApiModule } from '@src/api/api.module';
import { TagModule } from '@src/tag/tag.module';

import { GameVersionController } from './game-version.controller';
import { GameVersionService } from './game-version.service';

@Module({
  imports: [TagModule, ApiModule],
  controllers: [GameVersionController],
  providers: [GameVersionService],
  exports: [],
})
export class GameVersionModule {}
