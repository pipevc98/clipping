import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ClipsService } from './clips.service';

@Controller('clips')
export class ClipsController {
  constructor(private readonly clipsService: ClipsService) {}

  @Post()
  async create(@Body('url') url: string) {
    return this.clipsService.addVideoJob(url);
  }

  @Get(':jobId')
  async getStatus(@Param('jobId') jobId: string) {
    const job = await this.clipsService.getJobStatus(jobId);
    if (!job) {
      throw new NotFoundException(`Job ${jobId} no encontrado`);
    }
    return job;
  }
}
