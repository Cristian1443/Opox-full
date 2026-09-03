// ─── Bloque 12 · Configuración ──────────────────────────────────────────────

export type TonePersonality = 'cercano' | 'formal' | 'directo' | 'motivador' | 'equilibrado' | 'exigente';
export type DetailLevel = 0 | 1 | 2; // 0=Breve · 1=Medio · 2=Profundo
export type HintStyle = 'socraticas' | 'directas';
export type ReinforcementLevel = 'alto' | 'normal' | 'ninguno';
export type AppTheme = 'auto' | 'light' | 'dark';

export interface UserPreferences {
    userId: string;
    // Tono IA (12.5) — alineado con Motor /tone
    personality: TonePersonality;
    detailLevel: DetailLevel;
    hintStyle: HintStyle;
    reinforcementLevel: ReinforcementLevel;
    // Accesibilidad (12.6)
    theme: AppTheme;
    fontScale: number; // 0.85 | 1.0 | 1.15 | 1.3
    reduceMotion: boolean;
    updatedAt: string; // ISO
}

export interface UpdatePreferencesInput {
    personality?: TonePersonality;
    detailLevel?: DetailLevel;
    hintStyle?: HintStyle;
    reinforcementLevel?: ReinforcementLevel;
    theme?: AppTheme;
    fontScale?: number;
    reduceMotion?: boolean;
}

/** Perfil de tono en el formato que espera el Motor IA en cada llamada. */
export interface ToneProfile {
    personalidad: 'Cercano' | 'Formal' | 'Directo' | 'Motivador';
    nivel_detalle: 'Breve' | 'Medio' | 'Profundo';
    estilo_pistas: 'Socraticas' | 'Directas';
    refuerzo: 'Alto' | 'Normal' | 'Ninguno';
}

export type FeedbackType = 'suggestion' | 'bug' | 'other';

export interface SubmitFeedbackInput {
    type: FeedbackType;
    message: string;
}

export interface ProStatsTopicBreakdown {
    topicId: string;
    topic: string;
    total: number;
    correct: number;
    accuracyPct: number;
}

export interface ProStats {
    totalQuestions: number;
    correctQuestions: number;
    accuracyPct: number;          // 0–100
    passedProbabilityPct: number; // heurística basada en accuracy + streak
    studyStreakDays: number;
    topicsAttempted: number;
    topicsStrong: number;   // accuracy >= 80 %
    topicsWeak: number;     // accuracy < 50 %
    topicBreakdown: ProStatsTopicBreakdown[];
    avgSecsPerQuestion: number | null; // null = sin datos de tiempo todavía
    computedAt: string; // ISO
}

export interface ProStatsExportResult {
    period: string; // 'week' | 'month' | 'all'
    downloadUrl: string;
    message: string;
}
