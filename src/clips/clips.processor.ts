import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const YTDLP = 'yt-dlp --cookies /root/cookies.txt';

@Processor('video-queue')
export class ClipsProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    const { url } = job.data;
    console.log(`[x] Descargando video: ${url}`);

    // 1. Obtener el ID del video
    const { stdout: videoId } = await execAsync(`${YTDLP} --get-id "${url}"`);
    const id = videoId.trim();
    const videoPath = `/tmp/${id}.mp4`;
    const clipsDir = `/tmp/${id}_clips`;

    // 2. Descargar el video en mp4
    await execAsync(`${YTDLP} -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4" -o "${videoPath}" "${url}"`);
    console.log(`[x] Video descargado: ${videoPath}`);

    // 3. Obtener duración real y calcular estimado
    const { stdout: durationRaw } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`);
    const durationSeconds = parseFloat(durationRaw.trim());
    const durationMinutes = durationSeconds / 60;
    const estimatedMinutes = Math.ceil(1 + durationMinutes * 0.6);
    const estimatedReadyAt = new Date(Date.now() + estimatedMinutes * 60 * 1000).toISOString();
    await job.updateProgress({ estimatedMinutes, estimatedReadyAt, durationMinutes: Math.ceil(durationMinutes) });
    console.log(`[x] Duración: ${Math.ceil(durationMinutes)} min — Estimado: ${estimatedMinutes} min`);

    // 4. Crear carpeta para los clips
    await execAsync(`mkdir -p ${clipsDir}`);

    // 5. Calcular número de clips
    const totalClips = Math.ceil(durationSeconds / 60);
    const readyClips: string[] = [];
    await job.updateProgress({ estimatedMinutes, estimatedReadyAt, durationMinutes: Math.ceil(durationMinutes), totalClips, readyClips });

    // 6. Procesar cada clip individualmente
    for (let i = 0; i < totalClips; i++) {
      const startSeconds = i * 60;
      const clipPath = `${clipsDir}/clip_${String(i).padStart(3, '0')}.mp4`;
      await execAsync(
        `ffmpeg -ss ${startSeconds} -i "${videoPath}" -t 60 -vf "setpts=PTS/1.05,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,hflip" -af "atempo=1.05" -c:v libx264 -c:a aac "${clipPath}"`,
        { timeout: 600000 }
      );
      readyClips.push(clipPath);
      console.log(`[v] Clip ${i + 1}/${totalClips} listo: ${clipPath}`);
      await job.updateProgress({ estimatedMinutes, estimatedReadyAt, durationMinutes: Math.ceil(durationMinutes), totalClips, readyClips });
    }

    return { status: 'completado', videoId: id, url, clips: readyClips };
  }
}
