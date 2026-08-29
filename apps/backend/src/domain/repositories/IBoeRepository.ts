import type {
    BoeWatchedRegulation,
    BoeChange,
    BoeChangeFragment,
    BoeChangeInput,
    BoeAlertRead,
    BoeMiniTestResult,
    TrainingTopic,
} from '../entities';

/**
 * Contrato del repositorio del Monitor BOE.
 * Implementado por SupabaseBoeRepository en infrastructure/.
 */
export interface IBoeRepository {
    // ── Normas en seguimiento ───────────────────────────────────────────────
    listRegulations(userId: string): Promise<BoeWatchedRegulation[]>;
    getRegulation(id: string, userId: string): Promise<BoeWatchedRegulation | null>;
    addRegulation(data: {
        userId: string;
        boeIdentifier: string;
        title: string;
        motorNormaId?: string;
    }): Promise<BoeWatchedRegulation>;
    removeRegulation(id: string, userId: string): Promise<void>;

    // ── Feed de cambios ─────────────────────────────────────────────────────
    /** Cambios de normas que el usuario sigue, con estado read/bookmark personalizado. */
    getFeedChanges(userId: string): Promise<Array<BoeChange & {
        isRead: boolean;
        isBookmarked: boolean;
    }>>;

    // ── Detalle del cambio ──────────────────────────────────────────────────
    getChange(changeId: string): Promise<BoeChange | null>;
    getChangeFragments(changeId: string): Promise<BoeChangeFragment[]>;

    // ── Lecturas ────────────────────────────────────────────────────────────
    markRead(userId: string, changeId: string): Promise<BoeAlertRead>;
    isRead(userId: string, changeId: string): Promise<boolean>;

    // ── Marcadores ──────────────────────────────────────────────────────────
    /** Alterna el estado de marcador. Devuelve el nuevo estado. */
    toggleBookmark(userId: string, changeId: string): Promise<boolean>;
    isBookmarked(userId: string, changeId: string): Promise<boolean>;

    // ── Mini-test ───────────────────────────────────────────────────────────
    saveMiniTestResult(data: {
        userId: string;
        changeId: string;
        score: number;
        total: number;
    }): Promise<BoeMiniTestResult>;
    getMiniTestResult(userId: string, changeId: string): Promise<BoeMiniTestResult | null>;

    // ── Temas del temario ───────────────────────────────────────────────────
    listTopics(oposicion: string): Promise<TrainingTopic[]>;

    // ── Sincronización con Motor BOE ────────────────────────────────────────
    /** Inserta o actualiza un cambio del Motor BOE y reemplaza sus fragmentos. */
    upsertChange(input: BoeChangeInput): Promise<void>;
}
