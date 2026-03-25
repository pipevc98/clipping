import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ClipsController } from './clips.controller';
import { ClipsProcessor } from './clips.processor';
import { ClipsService } from './clips.service';
import { SubtitlesProcessor } from './subtitles.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'video-queue' }),
    BullModule.registerQueue({ name: 'subtitles-queue' }),
  ],
  controllers: [ClipsController],
  providers: [ClipsProcessor, SubtitlesProcessor, ClipsService],
  exports: [ClipsService],
})
export class ClipsModule {}
