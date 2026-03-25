import { Body, Controller, Get, NotFoundException, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { existsSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClipsService } from './clips.service';

@UseGuards(JwtAuthGuard)
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

  @Get(':videoId/clips/:filename')
  downloadClip(
    @Param('videoId') videoId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = `/tmp/${videoId}_clips/${filename}`;
    if (!existsSync(filePath)) {
      throw new NotFoundException(`Clip ${filename} no encontrado`);
    }
    res.download(filePath);
  }
}
