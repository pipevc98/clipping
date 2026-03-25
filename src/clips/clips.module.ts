import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ClipsController } from './clips.controller';
import { ClipsProcessor } from './clips.processor';
import { ClipsService } from './clips.service';

@Module({
  imports: [
    // Registramos la cola específica para este módulo
    BullModule.registerQueue({
      name: 'video-queue',
    }),
  ],
  controllers: [ClipsController],
  providers: [ClipsProcessor, ClipsService],
  exports: [ClipsService],
})
export class ClipsModule {}
