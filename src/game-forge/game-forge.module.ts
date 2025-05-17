import { Module } from '@nestjs/common';

import { GameVersionModule } from '@src/game-version/game-version.module';
import { TagModule } from '@src/tag/tag.module';

import { GameForgeController } from './game-forge.controller';
import { GameForgeService } from './game-forge.service';

@Module({
  imports: [TagModule, GameVersionModule],
  controllers: [GameForgeController],
  providers: [GameForgeService],
  exports: [GameForgeService],
})
export class GameForgeModule {}
