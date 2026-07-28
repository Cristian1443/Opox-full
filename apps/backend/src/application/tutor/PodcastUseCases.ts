import type { ITutorRepository } from '../../domain';
import { EpisodeNotFoundError } from '../../domain';
import type { TutorPodcastEpisode, TutorPodcastProgress } from '../../domain/entities';

// ─── Listar episodios por oposición ──────────────────────────────────────────
export class ListEpisodesUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(oposicion: string): Promise<TutorPodcastEpisode[]> {
        return this.tutorRepo.listEpisodes(oposicion);
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
        const episode = await this.tutorRepo.getEpisode(params.episodeId);
        if (!episode) throw new EpisodeNotFoundError();
        return this.tutorRepo.saveProgress(params);
    }
}
