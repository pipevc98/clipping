import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const YTDLP = 'yt-dlp --js-runtimes deno:/root/.deno/bin/deno --cookies /root/cookies.txt';

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
    const estimatedMinutes = Math.ceil(1 + durationMinutes * 0.5 + durationMinutes * 0.1);
    const estimatedReadyAt = new Date(Date.now() + estimatedMinutes * 60 * 1000).toISOString();
    await job.updateProgress({ estimatedMinutes, estimatedReadyAt, durationMinutes: Math.ceil(durationMinutes) });
    console.log(`[x] Duración: ${Math.ceil(durationMinutes)} min — Estimado: ${estimatedMinutes} min`);

    // 3. Transcribir audio con Whisper y generar subtítulos
    console.log(`[x] Transcribiendo audio con Whisper...`);
    await execAsync(`whisper "${videoPath}" --model tiny --output_format srt --output_dir /tmp`, { timeout: 1800000 });
    const srtPath = `/tmp/${id}.srt`;
    console.log(`[x] Subtítulos generados: ${srtPath}`);

    // 4. Crear carpeta para los clips
    await execAsync(`mkdir -p ${clipsDir}`);

    // 5. Cortar en clips de 1 minuto con subtítulos, espejo y velocidad 1.05x en formato reel 9:16
    await execAsync(
      `ffmpeg -i "${videoPath}" -vf "setpts=PTS/1.05,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,hflip,subtitles=${srtPath}" -af "atempo=1.05" -c:v libx264 -c:a aac -segment_time 60 -f segment -reset_timestamps 1 "${clipsDir}/clip_%03d.mp4"`,
      { timeout: 1800000 }
    );
    console.log(`[v] Clips generados en: ${clipsDir}`);

    // 6. Listar los clips generados
    const { stdout: clipList } = await execAsync(`ls ${clipsDir}`);
    const clips = clipList.trim().split('\n').map(f => `${clipsDir}/${f}`);

    return { status: 'completado', url, clips };
  }
}
