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

    // 3. Transcribir audio con Whisper y generar subtítulos
    console.log(`[x] Transcribiendo audio con Whisper...`);
    await execAsync(`whisper "${videoPath}" --model base --output_format srt --output_dir /tmp`, { timeout: 1800000 });
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
