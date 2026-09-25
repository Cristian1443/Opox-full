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

// ─── Caché en memoria para resúmenes generados por el Motor ───────────────────
// Compartida entre instancias dentro del mismo proceso. Evita re-llamar al Motor
// para el mismo (topicId, oposicion, detailLevel) — clave para la segunda consulta
// cuando el usuario cambia de pill (Esquema ↔ Medio ↔ Profundo).
// TTL 30 min: suficiente para cubrir una sesión de estudio sin servir contenido
// obsoleto si el Motor re-indexa el curso.
const _summaryMemCache = new Map<string, { data: TutorSummary; ts: number }>();
const SUMMARY_MEM_TTL = 30 * 60 * 1_000;
function _memKey(topicId: string, oposicion: string, level: number) {
    return `${topicId}::${oposicion}::${level}`;
}

// ─── Obtener resumen de un tema (mem-cache → Supabase → Motor) ────────────────
export class GetSummaryUseCase {
    constructor(
        private readonly tutorRepo: ITutorRepository,
        private readonly tutorAi?: ITutorAiClient,
    ) {}

    async execute(topicId: string, oposicion: string, cursoId?: string, detailLevel?: number): Promise<TutorSummary> {
        const level = detailLevel ?? 1;
        const memKey = _memKey(topicId, oposicion, level);

        // 1. In-memory cache (todos los niveles).
        const mem = _summaryMemCache.get(memKey);
        if (mem && Date.now() - mem.ts < SUMMARY_MEM_TTL) return mem.data;

        // 2. Supabase (solo nivel 1 — tabla siempre vacía en producción, pero por si acaso).
        if (level === 1) {
            const cached = await this.tutorRepo.getSummary(topicId, oposicion);
            if (cached) {
                _summaryMemCache.set(memKey, { data: cached, ts: Date.now() });
                return cached;
            }
        }

        if (!this.tutorAi) throw new SummaryNotFoundError();

        // 3. Motor — construir TutorSummary temporal (no se persiste en Supabase).
        try {
            const sections = await this.tutorAi.getSummary({ topicId, oposicion, cursoId, detailLevel: level });
            if (!sections.length) throw new Error('Motor devolvió 0 secciones');

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
            // Guardar en mem-cache para que el siguiente cambio de pill sea instantáneo.
            _summaryMemCache.set(memKey, { data: summary, ts: Date.now() });
            return summary;
        } catch (err) {
            logger.warn('[GetSummary] Motor falló', { err: String(err) });
            throw new SummaryNotFoundError();
        }
    }
}
