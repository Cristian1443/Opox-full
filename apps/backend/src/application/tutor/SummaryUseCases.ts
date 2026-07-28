import type { ITutorRepository } from '../../domain';
import { SummaryNotFoundError } from '../../domain';
import type { TutorSummary } from '../../domain/entities';

// ─── Listar resúmenes disponibles para una oposición ─────────────────────────
export class ListSummariesUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(oposicion: string): Promise<TutorSummary[]> {
        return this.tutorRepo.listSummaries(oposicion);
    }
}

// ─── Obtener resumen de un tema ───────────────────────────────────────────────
export class GetSummaryUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(topicId: string, oposicion: string): Promise<TutorSummary> {
        // TODO(ia-bloque8): si no existe en BD, llamar TutorAiContract.generateSummary()
        // y persistirlo antes de devolverlo (cache-on-miss)
        const summary = await this.tutorRepo.getSummary(topicId, oposicion);
        if (!summary) throw new SummaryNotFoundError();
        return summary;
    }
}
