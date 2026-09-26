import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { logger } from '@opox/utils';

// Workaround del bug del Motor documentado en INFORME_PODCAST_BUGS.md (Bug 1b):
// el mp3 que devuelve el Motor no trae cabecera Xing/VBRI, así que ExoPlayer
// (Android) reporta `duration=0` para el archivo y cualquier seekTo se
// resetea a 0.0 — confirmado en dispositivo real con logs del propio player.
// Sin esa cabecera (o un bitrate constante declarado), los decoders no pueden
// calcular a qué byte corresponde cada segundo de audio.
//
// Esta clase re-codifica el mp3 una sola vez (a CBR con `ffmpeg`/libmp3lame,
// que escribe la cabecera Xing por defecto) y lo cachea en disco. Las
// peticiones siguientes — incluyendo los Range requests que dispara cada
// seek — se sirven directo del archivo ya cacheado vía `res.sendFile`
// (Content-Length/Accept-Ranges/Range los resuelve Express solo).
export class PodcastAudioTranscoder {
    private readonly cacheDir = path.join(os.tmpdir(), 'opox-podcast-cache');
    // Evita re-transcodificar el mismo archivo en paralelo si llegan varias
    // peticiones (p. ej. un HEAD de sondeo seguido de inmediato por el GET real)
    // antes de que la primera termine.
    private readonly inFlight = new Map<string, Promise<string>>();

    getCachePath(filename: string): string {
        return path.join(this.cacheDir, filename);
    }

    async isCached(filename: string): Promise<boolean> {
        try {
            const s = await stat(this.getCachePath(filename));
            return s.isFile() && s.size > 0;
        } catch {
            return false;
        }
    }

    /** Descarga (ya la trae el caller) + re-codifica + cachea. Devuelve la ruta local final. */
    async ensureCached(filename: string, sourceBuffer: Buffer): Promise<string> {
        const cachedPath = this.getCachePath(filename);
        if (await this.isCached(filename)) return cachedPath;

        const existing = this.inFlight.get(filename);
        if (existing) return existing;

        const task = this.transcode(filename, sourceBuffer, cachedPath).finally(() => {
            this.inFlight.delete(filename);
        });
        this.inFlight.set(filename, task);
        return task;
    }

    private async transcode(filename: string, sourceBuffer: Buffer, cachedPath: string): Promise<string> {
        await mkdir(this.cacheDir, { recursive: true });
        const tmpInput = path.join(this.cacheDir, `src-${randomUUID()}.mp3`);
        const tmpOutput = path.join(this.cacheDir, `out-${randomUUID()}.mp3`);
        await writeFile(tmpInput, sourceBuffer);

        try {
            await this.runFfmpeg(tmpInput, tmpOutput);
            // Rename atómico al nombre final — evita que una petición concurrente
            // lea un archivo a medio escribir.
            await rm(cachedPath, { force: true });
            await rename(tmpOutput, cachedPath);
            logger.info('[podcast-transcoder] mp3 re-codificado a CBR con Xing header', { filename });
            return cachedPath;
        } catch (err) {
            const isEnoent = (err as NodeJS.ErrnoException).code === 'ENOENT';
            if (isEnoent) {
                // ffmpeg no está instalado en este entorno (habitual en dev Windows).
                // Servimos el MP3 original sin re-codificar: el seek en Android
                // ExoPlayer no funcionará (sin cabecera Xing), pero el audio se
                // reproduce correctamente. En producción (Render) ffmpeg sí existe.
                logger.warn('[podcast-transcoder] ffmpeg no encontrado — sirviendo MP3 sin transcodificar (seek deshabilitado en Android)', { filename });
                await rm(cachedPath, { force: true });
                await rename(tmpInput, cachedPath);
                return cachedPath;
            }
            throw err;
        } finally {
            // tmpInput puede ya no existir si lo renombramos en el fallback.
            await rm(tmpInput, { force: true }).catch(() => undefined);
            await rm(tmpOutput, { force: true }).catch(() => undefined);
        }
    }

    private runFfmpeg(inputPath: string, outputPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // -b:a 128k sin -abr → CBR real (no VBR). libmp3lame escribe la
            // cabecera Xing por defecto (-write_xing 1 lo deja explícito).
            const args = [
                '-y',
                '-i', inputPath,
                '-vn',
                '-c:a', 'libmp3lame',
                '-b:a', '128k',
                '-write_xing', '1',
                outputPath,
            ];
            const proc = spawn('ffmpeg', args);
            let stderr = '';
            proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
            proc.on('error', (err) => reject(err));
            proc.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`ffmpeg salió con código ${code}: ${stderr.slice(-500)}`));
            });
        });
    }
}
