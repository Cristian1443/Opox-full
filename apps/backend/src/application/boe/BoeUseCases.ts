import type { IBoeRepository, BoeChange, BoeChangeFragment } from '../../domain';
import { computeBoeDiff } from './boeDiff';
import {
    BoeChangeNotFoundError,
} from '../../domain';
import type { AiApiContract, BoeMiniTestQuestionDto } from '@opox/types';
import type {
    BoeFeedSection,
    BoeFeedResponse,
    BoeChangeDetail,
    BoeComparisonResponse,
    BoeMiniTestResponse,
    TrainingTopic,
} from '@opox/types';
import { logger } from '@opox/utils';

// ─── Feed (pantalla 10.1) ─────────────────────────────────────────────────────

export class GetBoeFeedUseCase {
    constructor(private readonly repo: IBoeRepository) {}

    async execute(userId: string): Promise<BoeFeedResponse> {
        const changes = await this.repo.getFeedChanges(userId);

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const thisWeek: typeof changes = [];
        const earlier: typeof changes = [];

        for (const c of changes) {
            if (c.detectedAt >= weekAgo) {
                thisWeek.push(c);
            } else {
                earlier.push(c);
            }
        }

        const toChange = (c: typeof changes[number]) => ({
            id: c.id,
            boeIdentifier: c.boeIdentifier,
            regulationTitle: c.regulationTitle,
            shortTitle: c.shortTitle,
            articulo: c.articulo,
            changeType: c.changeType,
            detectedAt: c.detectedAt.toISOString(),
            isRead: c.isRead,
            isBookmarked: c.isBookmarked,
            affectedQuestionsCount: c.affectedQuestions,
        });

        const sections: BoeFeedSection[] = [];
        if (thisWeek.length > 0) {
            sections.push({ sectionTitle: 'Esta semana', data: thisWeek.map(toChange) });
        }
        if (earlier.length > 0) {
            sections.push({ sectionTitle: 'Anterior', data: earlier.map(toChange) });
        }

        const totalUnread = changes.filter((c) => !c.isRead).length;

        return { sections, totalUnread };
    }
}

// ─── Detalle (pantalla 10.2) ──────────────────────────────────────────────────

export class GetBoeChangeDetailUseCase {
    constructor(private readonly repo: IBoeRepository) {}

    async execute(changeId: string, userId: string): Promise<BoeChangeDetail> {
        const [change, fragments, isRead, isBookmarked, miniTestResult] = await Promise.all([
            this.repo.getChange(changeId),
            this.repo.getChangeFragments(changeId),
            this.repo.isRead(userId, changeId),
            this.repo.isBookmarked(userId, changeId),
            this.repo.getMiniTestResult(userId, changeId),
        ]);

        if (!change) throw new BoeChangeNotFoundError();

        const hint = buildHint(change, fragments);

        return {
            id: change.id,
            boeIdentifier: change.boeIdentifier,
            regulationTitle: change.regulationTitle,
            shortTitle: change.shortTitle,
            articulo: change.articulo,
            changeType: change.changeType,
            detectedAt: change.detectedAt.toISOString(),
            isRead,
            isBookmarked,
            affectedQuestionsCount: change.affectedQuestions,
            fragments: fragments.map((f) => ({ type: f.fragType, text: f.text })),
            miniTestCompleted: !!miniTestResult,
            miniTestScore: miniTestResult?.score ?? null,
            miniTestTotal: miniTestResult?.total ?? null,
            sourceDescription: `${change.boeIdentifier} · ${change.regulationTitle}`,
            hint,
        };
    }
}

// ─── Comparativa (pantalla 10.3) ──────────────────────────────────────────────

export class GetBoeComparisonUseCase {
    constructor(private readonly repo: IBoeRepository) {}

    async execute(changeId: string): Promise<BoeComparisonResponse> {
        const [change, fragments] = await Promise.all([
            this.repo.getChange(changeId),
            this.repo.getChangeFragments(changeId),
        ]);

        if (!change) throw new BoeChangeNotFoundError();

        const hint = buildHint(change, fragments);

        const antesText = fragments.find((f) => f.fragType === 'antes')?.text ?? '';
        const despuesText = fragments.find((f) => f.fragType === 'despues')?.text ?? '';
        const { antesSegments, despuesSegments } = computeBoeDiff(antesText, despuesText);

        return {
            articulo: change.articulo,
            regulationTitle: change.regulationTitle,
            boeIdentifier: change.boeIdentifier,
            blocks: [
                { type: 'antes', segments: antesSegments },
                { type: 'despues', segments: despuesSegments },
            ],
            hint,
        };
    }
}

// ─── Mini-test (pantalla 10.4) ───────────────────────────────────────────────

export class GetBoeMiniTestUseCase {
    constructor(
        private readonly repo: IBoeRepository,
        private readonly ai: AiApiContract,
    ) {}

    async execute(changeId: string, userId: string): Promise<BoeMiniTestResponse> {
        const [change, fragments] = await Promise.all([
            this.repo.getChange(changeId),
            this.repo.getChangeFragments(changeId),
        ]);

        if (!change) throw new BoeChangeNotFoundError();

        const antes = fragments.find((f) => f.fragType === 'antes')?.text ?? '';
        const despues = fragments.find((f) => f.fragType === 'despues')?.text ?? '';

        logger.info('[boe] generateBoeMiniTest', { changeId, articulo: change.articulo });

        const result = await this.ai.generateBoeMiniTest({
            oposicion: 'justicia-tramitacion',
            articulo: change.articulo,
            ley: change.regulationTitle,
            identificador_boe: change.boeIdentifier,
            antes,
            despues,
            count: 3,
        });

        const questions: BoeMiniTestQuestionDto[] = result.questions.map((q) => ({
            id: q.id,
            context: q.context,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
        }));

        // Marcar como leído al abrir el mini-test
        await this.repo.markRead(userId, changeId).catch(() => void 0);

        return {
            changeId: change.id,
            articulo: change.articulo,
            questions,
        };
    }
}

// ─── Marcar como leído ───────────────────────────────────────────────────────

export class MarkBoeReadUseCase {
    constructor(private readonly repo: IBoeRepository) {}

    async execute(changeId: string, userId: string): Promise<{ isRead: boolean }> {
        const change = await this.repo.getChange(changeId);
        if (!change) throw new BoeChangeNotFoundError();
        await this.repo.markRead(userId, changeId);
        return { isRead: true };
    }
}

// ─── Toggle marcador ──────────────────────────────────────────────────────────

export class ToggleBoeBookmarkUseCase {
    constructor(private readonly repo: IBoeRepository) {}

    async execute(changeId: string, userId: string): Promise<{ isBookmarked: boolean }> {
        const change = await this.repo.getChange(changeId);
        if (!change) throw new BoeChangeNotFoundError();
        const isBookmarked = await this.repo.toggleBookmark(userId, changeId);
        return { isBookmarked };
    }
}

// ─── Guardar resultado del mini-test ─────────────────────────────────────────

export class CompleteBoeMiniTestUseCase {
    constructor(private readonly repo: IBoeRepository) {}

    async execute(changeId: string, userId: string, score: number, total: number): Promise<void> {
        const change = await this.repo.getChange(changeId);
        if (!change) throw new BoeChangeNotFoundError();
        await this.repo.saveMiniTestResult({ userId, changeId, score, total });
    }
}

// ─── Temas del temario ────────────────────────────────────────────────────────

export class ListTopicsUseCase {
    constructor(private readonly repo: IBoeRepository) {}

    async execute(oposicion: string): Promise<TrainingTopic[]> {
        return this.repo.listTopics(oposicion);
    }
}

// ─── Helpers privados ─────────────────────────────────────────────────────────

function buildHint(change: BoeChange, fragments: BoeChangeFragment[]): string {
    const typeLabels: Record<string, string> = {
        modificacion: 'Este artículo ha sido modificado',
        derogacion: 'Este artículo ha sido derogado',
        nueva: 'Este es un artículo nuevo',
        tipografica: 'Esta es una corrección de errata',
    };
    const label = typeLabels[change.changeType] ?? 'Este artículo ha cambiado';
    const despues = fragments.find((f) => f.fragType === 'despues')?.text ?? '';
    const snippet = despues.length > 120 ? despues.slice(0, 117) + '...' : despues;
    return `${label}. Redacción vigente: "${snippet}"`;
}
