// ─── Monitor BOE · Domain entities ───────────────────────────────────────────

export type BoeChangeType = 'modificacion' | 'derogacion' | 'nueva' | 'tipografica';

/** Payload de entrada para sincronizar un cambio del Motor BOE en nuestra DB. */
export interface BoeChangeInput {
    boeIdentifier: string;
    regulationTitle: string;
    shortTitle: string;
    articulo: string;
    changeType: BoeChangeType;
    affectedQuestions: number;
    detectedAt: Date;
    fragmentos: Array<{ fragType: 'antes' | 'despues'; text: string }>;
}

export interface BoeWatchedRegulation {
    id: string;
    userId: string;
    boeIdentifier: string;
    title: string;
    followedAt: Date;
    lastCheckedAt: Date | null;
}

export interface BoeChange {
    id: string;
    boeIdentifier: string;
    regulationTitle: string;
    shortTitle: string;
    articulo: string;
    changeType: BoeChangeType;
    affectedQuestions: number;
    detectedAt: Date;
    createdAt: Date;
}

export interface BoeChangeFragment {
    id: string;
    changeId: string;
    fragType: 'antes' | 'despues';
    text: string;
    createdAt: Date;
}

export interface BoeAlertRead {
    id: string;
    userId: string;
    changeId: string;
    readAt: Date;
}

export interface BoeAlertBookmark {
    id: string;
    userId: string;
    changeId: string;
    bookmarkedAt: Date;
}

export interface BoeMiniTestResult {
    id: string;
    userId: string;
    changeId: string;
    score: number;
    total: number;
    completedAt: Date;
}

export interface TrainingTopic {
    id: string;
    oposicion: string;
    topicId: string;
    label: string;
    sortOrder: number;
}
