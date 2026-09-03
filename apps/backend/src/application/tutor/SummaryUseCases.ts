import { logger } from '@opox/utils';
import type { ITutorRepository } from '../../domain';
import { SummaryNotFoundError } from '../../domain';
import type { ITutorAiClient } from '../../domain/repositories/ITutorAiClient';
import type { TutorSummary } from '../../domain/entities';

// ─── Listar resúmenes disponibles para una oposición ─────────────────────────
export class ListSummariesUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(oposicion: string): Promise<TutorSummary[]> {
        return this.tutorRepo.listSummaries(oposicion);
    }
}

// ─── Obtener resumen de un tema (Supabase → Motor como fallback) ──────────────
export class GetSummaryUseCase {
    constructor(
        private readonly tutorRepo: ITutorRepository,
        private readonly tutorAi?: ITutorAiClient,
    ) {}

    async execute(topicId: string, oposicion: string): Promise<TutorSummary> {
        const cached = await this.tutorRepo.getSummary(topicId, oposicion);
        if (cached) return cached;

        if (!this.tutorAi) throw new SummaryNotFoundError();

        // Motor como fallback — construir TutorSummary temporal (no se persiste)
        try {
            const sections = await this.tutorAi.getSummary({ topicId, oposicion });
            if (!sections.length) throw new Error('Motor devolvió 0 secciones');

            // Adaptar al formato de TutorSummary con secciones tipadas
            const now = new Date();
            const summary: TutorSummary = {
                id: `motor-${topicId}-${Date.now()}`,
                topicId,
                topicTitle: topicId,
                oposicion,
                sections: sections.map((s, i) => ({
                    id: `s${i}`,
                    type: 'structure',
                    title: s.title,
                    icon: 'book-outline',
                    content: [s.content],
                })),
                updatedAt: now,
            };
            return summary;
        } catch (err) {
            logger.warn('[GetSummary] Motor falló', { err: String(err) });
            throw new SummaryNotFoundError();
        }
    }
}
