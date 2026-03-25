import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class ClipsService {
  constructor(@InjectQueue('video-queue') private readonly videoQueue: Queue) {}

  async addVideoJob(url: string) {
    const job = await this.videoQueue.add('process-video', { url });
    return { jobId: job.id, url };
  }

  async getJobStatus(jobId: string) {
    const job = await this.videoQueue.getJob(jobId);
    if (!job) {
      return null;
    }
    const state = await job.getState();
    return { jobId: job.id, state, data: job.data, returnValue: job.returnvalue };
  }
}
