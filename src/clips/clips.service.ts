import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class ClipsService {
  constructor(@InjectQueue('video-queue') private readonly videoQueue: Queue) {}

  async addVideoJob(url: string) {
    const job = await this.videoQueue.add('process-video', { url });

    // Estimar tiempo: ~1 min descarga + 0.5 min/min de video para Whisper + FFmpeg
    // Se actualiza con la duración real una vez que el processor la conoce
    const estimatedMinutes = 20;
    const estimatedAt = new Date(Date.now() + estimatedMinutes * 60 * 1000);

    return {
      jobId: job.id,
      url,
      estimatedMinutes,
      estimatedReadyAt: estimatedAt.toISOString(),
    };
  }

  async getJobStatus(jobId: string) {
    const job = await this.videoQueue.getJob(jobId);
    if (!job) {
      return null;
    }
    const state = await job.getState();
    return {
      jobId: job.id,
      state,
      data: job.data,
      progress: job.progress,
      returnValue: job.returnvalue,
    };
  }
}
