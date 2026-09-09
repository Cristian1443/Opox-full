import { logger } from '@opox/utils';
import type { ITutorRepository, IBoeRepository } from '../../domain';
import { EpisodeNotFoundError } from '../../domain';
import type { ITutorAiClient } from '../../domain/repositories/ITutorAiClient';
import type { TutorPodcastEpisode, TutorPodcastProgress } from '../../domain/entities';

// ─── Listar episodios por oposición ──────────────────────────────────────────
// La tabla `tutor_podcast_episodes` está vacía. Fallback a temas del temario:
// el mobile mostrará el picker de temas y al seleccionar uno se dispara la
// generación del podcast vía Motor con GeneratePodcastUseCase.
export class ListEpisodesUseCase {
    constructor(
        private readonly tutorRepo: ITutorRepository,
        private readonly boeRepo?: IBoeRepository,
    ) {}

    async execute(oposicion: string): Promise<TutorPodcastEpisode[]> {
        const cached = await this.tutorRepo.listEpisodes(oposicion);
        if (cached.length > 0) return cached;

        if (!this.boeRepo) return [];

        try {
            const topics = await this.boeRepo.listTopics(oposicion);
            const now = new Date();
            // Mismo criterio que ListSummariesUseCase: mostrar "Tema 1", "Tema 2"… en
            // vez del título largo (poco legible en el player y en el picker).
            return topics.map((t, i) => ({
                id: `topic-${t.topicId}`,
                oposicion,
                topicId: t.topicId,
                title: `Tema ${i + 1}`,
                totalSeconds: 0,
                createdAt: now,
            }));
        } catch (err) {
            logger.warn('[ListEpisodes] fallback a listTopics falló', { err: String(err) });
            return [];
        }
    }
}

// ─── Obtener episodio ─────────────────────────────────────────────────────────
export class GetEpisodeUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(id: string): Promise<TutorPodcastEpisode> {
        const episode = await this.tutorRepo.getEpisode(id);
        if (!episode) throw new EpisodeNotFoundError();
        return episode;
    }
}

// ─── Obtener progreso de reproducción ────────────────────────────────────────
export class GetProgressUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(userId: string, episodeId: string): Promise<TutorPodcastProgress | null> {
        return this.tutorRepo.getProgress(userId, episodeId);
    }
}

// ─── Guardar posición de reproducción ────────────────────────────────────────
export class SaveProgressUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(params: { userId: string; episodeId: string; positionSecs: number }): Promise<TutorPodcastProgress> {
        // Episodios generados por Motor tienen id sintético `motor-{filename}` sin fila
        // en `tutor_podcast_episodes`; en ese caso no persistimos el progreso.
        if (params.episodeId.startsWith('motor-') || params.episodeId.startsWith('topic-')) {
            return {
                userId: params.userId,
                episodeId: params.episodeId,
                positionSecs: params.positionSecs,
                updatedAt: new Date(),
            };
        }
        const episode = await this.tutorRepo.getEpisode(params.episodeId);
        if (!episode) throw new EpisodeNotFoundError();
        return this.tutorRepo.saveProgress(params);
    }
}

// ─── Generar podcast bajo demanda con Motor IA ────────────────────────────────
export interface GeneratePodcastResult {
    episodeId: string;
    title: string;
    /** Solo el nombre del archivo (podcast-xxxxx.mp3). El mobile construye la URL
     *  final `${API_BASE_URL}/tutor/podcast/audio/{filename}` que apunta al proxy
     *  del backend (necesario porque el Motor requiere X-API-Key). */
    filename: string;
    totalSeconds: number;
}

export class GeneratePodcastUseCase {
    constructor(private readonly tutorAi?: ITutorAiClient) {}

    async execute(params: {
        topicId: string;
        topicTitle: string;
        userId: string;
        cursoId?: string;
        duracion?: 'corta' | 'media';
        velocidad?: number;
    }): Promise<GeneratePodcastResult> {
        if (!this.tutorAi?.generatePodcast) {
            throw new Error('Motor IA no configurado para podcast');
        }
        const r = await this.tutorAi.generatePodcast({
            topicId: params.topicId,
            userId: params.userId,
            cursoId: params.cursoId,
            duracion: params.duracion,
            velocidad: params.velocidad,
        });
        const episodeId = `motor-${r.filename || Date.now()}`;
        return {
            episodeId,
            title: params.topicTitle,
            filename: r.filename,
            totalSeconds: r.estimatedSeconds,
        };
    }
}

// ─── Proxy audio del Motor (streaming) ────────────────────────────────────────
// El mp3 vive en el Motor tras auth con X-API-Key (+ X-OpenAI-Key en generación,
// pero el GET del audio ya no la exige). Este use case devuelve {status, headers, body}
// para que el controller haga stream al cliente.
export class ProxyPodcastAudioUseCase {
    constructor(
        private readonly motorBaseUrl: string,
        private readonly motorApiKey: string,
    ) {}

    async execute(filename: string): Promise<{ status: number; contentType: string; body: ReadableStream | null }> {
        const url = `${this.motorBaseUrl.replace(/\/$/, '')}/v1/classroom/podcast/${encodeURIComponent(filename)}`;
        const res = await fetch(url, {
            headers: { 'X-API-Key': this.motorApiKey },
        });
        return {
            status: res.status,
            contentType: res.headers.get('content-type') ?? 'audio/mpeg',
            body: res.body,
        };
    }
}
