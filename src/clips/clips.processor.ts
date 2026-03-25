import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Processor('video-queue')
export class ClipsProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    const { url } = job.data;
    console.log(`[x] Iniciando procesamiento del video: ${url}`);

    // Descarga el audio con yt-dlp y lo convierte a mp3 con FFmpeg
    const outputPath = `/tmp/%(id)s.%(ext)s`;
    const command = `yt-dlp --cookies /root/cookies.txt -x --audio-format mp3 -o "${outputPath}" "${url}"`;

    const { stdout, stderr } = await execAsync(command);
    console.log(stdout);
    if (stderr) console.error(stderr);

    console.log(`[v] Video procesado exitosamente: ${url}`);
    return { status: 'completado', url };
  }
}
