import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Processor('subtitles-queue')
export class SubtitlesProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    const { videoId } = job.data;
    const videoPath = `/tmp/${videoId}.mp4`;
    const clipsDir = `/tmp/${videoId}_clips`;
    const srtPath = `/tmp/${videoId}.srt`;

    // 1. Transcribir con Whisper
    console.log(`[x] Transcribiendo con Whisper: ${videoPath}`);
    await execAsync(`whisper "${videoPath}" --model tiny --output_format srt --output_dir /tmp`, { timeout: 1800000 });
    console.log(`[x] Subtítulos generados: ${srtPath}`);

    // 2. Obtener duración del video
    const { stdout: durationRaw } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`);
    const durationSeconds = parseFloat(durationRaw.trim());
    const totalClips = Math.ceil(durationSeconds / 60);
    const readyClips: string[] = [];
    await job.updateProgress({ totalClips, readyClips });

    // 3. Re-cortar clips desde el video original con subtítulos
    for (let i = 0; i < totalClips; i++) {
      const startSeconds = i * 60;
      const clipPath = `${clipsDir}/clip_${String(i).padStart(3, '0')}.mp4`;
      await execAsync(
        `ffmpeg -y -ss ${startSeconds} -i "${videoPath}" -t 60 -vf "setpts=PTS/1.05,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,hflip,subtitles=${srtPath}" -af "atempo=1.05" -c:v libx264 -c:a aac "${clipPath}"`,
        { timeout: 600000 }
      );
      readyClips.push(clipPath);
      console.log(`[v] Clip con subtítulos ${i + 1}/${totalClips}: ${clipPath}`);
      await job.updateProgress({ totalClips, readyClips });
    }

    return { status: 'completado', videoId, clips: readyClips };
  }
}
