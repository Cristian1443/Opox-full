import type { IBoeRepository, IDashboardRepository, BoeChange, BoeChangeFragment, BoeChangeType, BoeWatchedRegulation } from '../../domain';
import { computeBoeDiff } from './boeDiff';
import {
    BoeChangeNotFoundError,
} from '../../domain';
import type {
    AiApiContract,
    BoeMiniTestQuestionDto,
    MotorBoeContract,
    MotorCambio,
    MotorBoeCatalogResult,
} from '@opox/types';
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
        const [changes, regulations] = await Promise.all([
            this.repo.getFeedChanges(userId),
            this.repo.listRegulations(userId),
        ]);

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Prioridad: críticos primero (modificacion/derogacion > tipografica), luego más reciente
        const sorted = [...changes].sort((a, b) => {
            const priority = (c: typeof a) =>
                c.changeType === 'tipografica' ? 0 : c.affectedQuestions > 0 ? 2 : 1;
            const diff = priority(b) - priority(a);
            if (diff !== 0) return diff;
            return b.detectedAt.getTime() - a.detectedAt.getTime();
        });

        const thisWeek: typeof sorted = [];
        const earlier: typeof sorted = [];

        for (const c of sorted) {
            if (c.detectedAt >= weekAgo) {
                thisWeek.push(c);
            } else {
                earlier.push(c);
            }
        }

        const toChange = (c: typeof sorted[number]) => ({
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

        return { sections, totalUnread, watchedRegulationsCount: regulations.length };
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
    constructor(
        private readonly repo: IBoeRepository,
        private readonly dashboardRepo: IDashboardRepository,
    ) {}

    async execute(changeId: string, userId: string, score: number, total: number): Promise<void> {
        const change = await this.repo.getChange(changeId);
        if (!change) throw new BoeChangeNotFoundError();
        await this.repo.saveMiniTestResult({ userId, changeId, score, total });

        // Opopoints: máx 5 por mini-test BOE (3 preguntas), proporcional a aciertos
        const miniTestPoints = total > 0 ? Math.round((score / total) * 5) : 0;
        if (miniTestPoints > 0) {
            await this.dashboardRepo.registerActivity({
                userId,
                reason: 'test_boe_minitest',
                points: miniTestPoints,
            });
        }
    }
}

// ─── Temas del temario ────────────────────────────────────────────────────────

export class ListTopicsUseCase {
    constructor(private readonly repo: IBoeRepository) {}

    async execute(oposicion: string): Promise<TrainingTopic[]> {
        return this.repo.listTopics(oposicion);
    }
}

// ─── Gestión de normas seguidas ───────────────────────────────────────────────

export class ListFollowedRegulationsUseCase {
    constructor(private readonly repo: IBoeRepository) {}

    async execute(userId: string): Promise<BoeWatchedRegulation[]> {
        return this.repo.listRegulations(userId);
    }
}

export class FollowRegulationUseCase {
    constructor(
        private readonly repo: IBoeRepository,
        private readonly motor: MotorBoeContract | null,
        private readonly defaultCursoId: string | null,
    ) {}

    async execute(userId: string, boeIdentifier: string, titulo: string): Promise<BoeWatchedRegulation> {
        let motorNormaId: string | undefined;

        if (this.motor && this.defaultCursoId) {
            try {
                const norma = await this.motor.followRegulation(this.defaultCursoId, boeIdentifier, titulo);
                motorNormaId = norma.id;
            } catch (err: any) {
                // 409 = ya está en seguimiento en el Motor — no es error
                if (err?.response?.status !== 409) {
                    logger.warn('[boe] followRegulation motor error (non-fatal)', { boeIdentifier, err: err?.message });
                }
            }
        }

        return this.repo.addRegulation({ userId, boeIdentifier, title: titulo, motorNormaId });
    }
}

export class UnfollowRegulationUseCase {
    constructor(
        private readonly repo: IBoeRepository,
        private readonly motor: MotorBoeContract | null,
        private readonly defaultCursoId: string | null,
    ) {}

    async execute(regulationId: string, userId: string): Promise<void> {
        const regulation = await this.repo.getRegulation(regulationId, userId);
        if (!regulation) return;

        // Eliminar de nuestra BD primero
        await this.repo.removeRegulation(regulationId, userId);

        // Dejar de seguir en el Motor si tenemos el motor_norma_id
        if (this.motor && this.defaultCursoId && regulation.motorNormaId) {
            await this.motor.stopFollowingRegulation(regulation.motorNormaId, this.defaultCursoId)
                .catch(err => logger.warn('[boe] stopFollowingRegulation motor error (non-fatal)', { err: err?.message }));
        }
    }
}

export class SearchBoeRegulationsUseCase {
    constructor(
        private readonly motor: MotorBoeContract | null,
        private readonly defaultCursoId: string | null,
    ) {}

    async execute(query: string, limit = 20): Promise<MotorBoeCatalogResult> {
        if (!this.motor) {
            return { sincronizado: false, total: 0, ultima_sincronizacion: null, resultados: [] };
        }

        // Intentar catálogo del Motor (timeout corto configurado en MotorBoeClient.searchCatalog)
        let result: MotorBoeCatalogResult = { sincronizado: false, total: 0, ultima_sincronizacion: null, resultados: [] };
        try {
            result = await this.motor.searchCatalog(query, limit);
        } catch {
            // Catálogo no disponible (timeout, red) — ir directo al fallback
            logger.info('[boe] searchCatalog timeout/error — usando listRegulations como fallback');
        }

        // Fallback: mostrar las normas que el Motor ya monitoriza para el curso
        if ((!result.sincronizado || result.resultados.length === 0) && this.defaultCursoId) {
            try {
                const normas = await this.motor.listRegulations(this.defaultCursoId);
                const q = query.trim().toLowerCase();
                const filtradas = q
                    ? normas.filter(n =>
                        n.titulo.toLowerCase().includes(q) ||
                        n.identificador_boe.toLowerCase().includes(q),
                    )
                    : normas;
                return {
                    sincronizado: false,
                    total: filtradas.length,
                    ultima_sincronizacion: null,
                    resultados: filtradas.slice(0, limit).map(n => ({
                        id: n.id,
                        identificador_boe: n.identificador_boe,
                        titulo: n.titulo,
                        url: n.url,
                        activa: n.activa,
                    })),
                };
            } catch {
                // Fallback también falló — devolver vacío
            }
        }

        return result;
    }
}

export class SyncBoeCatalogUseCase {
    constructor(
        private readonly motor: MotorBoeContract | null,
    ) {}

    async execute(desde?: string): Promise<{ jobId: string }> {
        if (!this.motor) throw new Error('Motor BOE no configurado (MOTOR_BOE_BASE_URL)');
        const jobId = await this.motor.syncCatalog(desde);
        logger.info('[boe] syncCatalog job launched', { jobId, desde });
        return { jobId };
    }
}

// ─── Sincronización con Motor BOE ────────────────────────────────────────────

export interface SyncBoeResult {
    synced: number;
    skipped: number;
}

export class SyncBoeChangesUseCase {
    constructor(
        private readonly repo: IBoeRepository,
        private readonly motor: MotorBoeContract,
        private readonly onChanges?: (synced: number) => Promise<void>,
    ) {}

    async execute(cursoId: string): Promise<SyncBoeResult> {
        logger.info('[boe] syncChanges start', { cursoId });

        const jobId = await this.motor.checkForChanges(cursoId);
        logger.info('[boe] syncChanges job launched', { jobId });

        const job = await this.pollUntilDone(jobId);
        if (job.estado === 'error') {
            throw new Error(`Motor BOE job falló: ${job.mensaje}`);
        }

        const motorChanges = await this.motor.getChanges(cursoId);
        logger.info('[boe] syncChanges motor returned', { count: motorChanges.length });

        let synced = 0;
        let skipped = 0;

        for (const mc of motorChanges) {
            try {
                const input = buildChangeInput(mc);
                await this.repo.upsertChange(input);
                synced++;
                // Regenerar preguntas afectadas en el Motor (fire-and-forget)
                if (mc.preguntas_afectadas.length > 0) {
                    this.motor.regenerateQuestions(mc.id, cursoId)
                        .catch(err => logger.warn('[boe] regenerateQuestions error (non-fatal)', { id: mc.id, err: err?.message }));
                }
            } catch (e) {
                logger.warn('[boe] syncChanges skip', { id: mc.id, error: e });
                skipped++;
            }
        }

        logger.info('[boe] syncChanges done', { synced, skipped });

        // Notificación push si hay cambios reales
        if (synced > 0 && this.onChanges) {
            await this.onChanges(synced).catch(err =>
                logger.warn('[boe] syncChanges notification error', { err }),
            );
        }

        return { synced, skipped };
    }

    private async pollUntilDone(jobId: string, maxAttempts = 30): Promise<{ estado: string; mensaje: string }> {
        for (let i = 0; i < maxAttempts; i++) {
            const job = await this.motor.pollJob(jobId);
            if (job.estado === 'done' || job.estado === 'error') return job;
            await new Promise(r => setTimeout(r, 2_000));
        }
        throw new Error(`Motor BOE job ${jobId} no terminó en ${maxAttempts * 2}s`);
    }
}

// ─── Helpers privados ─────────────────────────────────────────────────────────

function buildChangeInput(mc: MotorCambio) {
    const antesTexts = mc.fragmentos.map(f => f.antes).filter(Boolean).join('\n\n');
    const despuesTexts = mc.fragmentos.map(f => f.despues).filter(Boolean).join('\n\n');

    const changeType = inferChangeType(antesTexts, despuesTexts);
    const articulo = extractArticulo(mc.fragmentos[0]?.contexto ?? '');
    const shortTitle = mc.norma_titulo.length > 60
        ? mc.norma_titulo.slice(0, 57) + '...'
        : mc.norma_titulo;

    const fragmentos: Array<{ fragType: 'antes' | 'despues'; text: string }> = [];
    if (antesTexts) fragmentos.push({ fragType: 'antes', text: antesTexts });
    if (despuesTexts) fragmentos.push({ fragType: 'despues', text: despuesTexts });

    return {
        boeIdentifier: mc.identificador_boe,
        regulationTitle: mc.norma_titulo,
        shortTitle,
        articulo,
        changeType,
        affectedQuestions: mc.preguntas_afectadas?.length ?? 0,
        detectedAt: new Date(mc.detectado),
        fragmentos,
        resumen: mc.resumen || undefined,
    };
}

function inferChangeType(antes: string, despues: string): BoeChangeType {
    if (antes && despues) return 'modificacion';
    if (antes && !despues) return 'derogacion';
    if (!antes && despues) return 'nueva';
    return 'modificacion';
}

function extractArticulo(contexto: string): string {
    if (!contexto) return 'Disposición';
    const match = contexto.match(/^(Art[íi]culo\s+\d+[a-zA-Z]*)/i);
    if (match?.[1]) return match[1].replace('Articulo', 'Artículo');
    return contexto.split('.')[0] ?? contexto.slice(0, 40);
}

function buildHint(change: BoeChange, fragments: BoeChangeFragment[]): string {
    const typeLabels: Record<string, string> = {
        modificacion: 'Este artículo ha sido modificado',
        derogacion: 'Este artículo ha sido derogado',
        nueva: 'Este es un artículo nuevo',
        tipografica: 'Esta es una corrección de errata',
    };
    const label = typeLabels[change.changeType] ?? 'Este artículo ha cambiado';
    // Usar el resumen del Motor si está disponible — es más limpio que truncar el texto
    if (change.resumen) return `${label}. ${change.resumen}`;
    const despues = fragments.find((f) => f.fragType === 'despues')?.text ?? '';
    const snippet = despues.length > 120 ? despues.slice(0, 117) + '...' : despues;
    return `${label}. Redacción vigente: "${snippet}"`;
}
