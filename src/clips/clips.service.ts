import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class ClipsService {
  constructor(@InjectQueue('video-queue') private readonly videoQueue: Queue) {}

  async addVideoJob(url: string) {
    const job = await this.videoQueue.add('process-video', { url });

    const estimatedMinutes = 10;
    const estimatedReadyAt = new Date(Date.now() + estimatedMinutes * 60 * 1000).toISOString();

    return {
      jobId: job.id,
      url,
      estimatedMinutes,
      estimatedReadyAt,
    };
  }

  async getJobStatus(jobId: string) {
    const job = await this.videoQueue.getJob(jobId);
    if (!job) return null;
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
