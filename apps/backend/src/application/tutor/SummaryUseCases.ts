import { logger } from '@opox/utils';
import type { ITutorRepository, IBoeRepository } from '../../domain';
import { SummaryNotFoundError } from '../../domain';
import type { ITutorAiClient } from '../../domain/repositories/ITutorAiClient';
import type { TutorSummary } from '../../domain/entities';

// ─── Listar resúmenes disponibles para una oposición ─────────────────────────
// La tabla `tutor_summaries` está vacía en producción (solo se poblaría si algún día
// pre-generamos resúmenes). Si viene vacía, caemos a `listTopics` del temario para
// que el TopicPicker del mobile muestre los temas del curso; al seleccionar uno,
// el GetSummaryUseCase pedirá al Motor el resumen bajo demanda.
export class ListSummariesUseCase {
    constructor(
        private readonly tutorRepo: ITutorRepository,
        private readonly boeRepo?: IBoeRepository,
    ) {}

    async execute(oposicion: string): Promise<TutorSummary[]> {
        const cached = await this.tutorRepo.listSummaries(oposicion);
        if (cached.length > 0) return cached;

        if (!this.boeRepo) return [];

        try {
            const topics = await this.boeRepo.listTopics(oposicion);
            const now = new Date();
            // En el Aula Virtual mostramos los temas como "Tema 1", "Tema 2"… (posición
            // en el temario, según sort_order que ya trae listTopics). El título largo
            // sirve poco en la UI del picker y no cabe legible en el player.
            return topics.map((t, i) => ({
                id: `topic-${t.topicId}`,
                topicId: t.topicId,
                topicTitle: `Tema ${i + 1}`,
                oposicion,
                sections: [],
                updatedAt: now,
            }));
        } catch (err) {
            logger.warn('[ListSummaries] fallback a listTopics falló', { err: String(err) });
            return [];
        }
    }
}

// ─── Obtener resumen de un tema (Supabase → Motor como fallback) ──────────────
export class GetSummaryUseCase {
    constructor(
        private readonly tutorRepo: ITutorRepository,
        private readonly tutorAi?: ITutorAiClient,
    ) {}

    async execute(topicId: string, oposicion: string, cursoId?: string, detailLevel?: number): Promise<TutorSummary> {
        // Solo usar caché cuando el nivel es el default (medio=1) — niveles distintos deben ir al Motor
        const cached = detailLevel === undefined || detailLevel === 1
            ? await this.tutorRepo.getSummary(topicId, oposicion)
            : null;
        if (cached) return cached;

        if (!this.tutorAi) throw new SummaryNotFoundError();

        // Motor como fallback — construir TutorSummary temporal (no se persiste)
        try {
            const sections = await this.tutorAi.getSummary({ topicId, oposicion, cursoId, detailLevel });
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
