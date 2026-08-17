// ─── Bloque 12 · Configuración ──────────────────────────────────────────────

export type TonePersonality = 'cercano' | 'equilibrado' | 'exigente';
export type DetailLevel = 0 | 1 | 2; // 0=Conciso · 1=Medio · 2=Extenso
export type AppTheme = 'auto' | 'light' | 'dark';

export interface UserPreferences {
    userId: string;
    // Tono IA (12.5)
    personality: TonePersonality;
    detailLevel: DetailLevel;
    directHints: boolean;
    motivational: boolean;
    // Accesibilidad (12.6)
    theme: AppTheme;
    fontScale: number; // 0.85 | 1.0 | 1.15 | 1.3
    reduceMotion: boolean;
    updatedAt: string; // ISO
}

export interface UpdatePreferencesInput {
    personality?: TonePersonality;
    detailLevel?: DetailLevel;
    directHints?: boolean;
    motivational?: boolean;
    theme?: AppTheme;
    fontScale?: number;
    reduceMotion?: boolean;
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
    computedAt: string; // ISO
}

export interface ProStatsExportResult {
    period: string; // 'week' | 'month' | 'all'
    downloadUrl: string | null; // stub null hasta implementar PDF real
    message: string;
}
