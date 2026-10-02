export interface ProStatsTopicRow {
    topicId: string;
    topic: string;
    total: number;
    correct: number;
}

export interface ProStatsWeekPoint {
    weekStart: string;            // YYYY-MM-DD (lunes, UTC)
    total: number;                // preguntas respondidas esa semana
    accuracyPct: number | null;   // null = semana sin actividad
}

export interface ProStats {
    totalQuestions: number;
    correctQuestions: number;
    accuracyPct: number;
    passedProbabilityPct: number;
    studyStreakDays: number;
    topicsAttempted: number;
    topicsStrong: number;
    topicsWeak: number;
    topicBreakdown: (ProStatsTopicRow & { accuracyPct: number })[];
    avgSecsPerQuestion: number | null; // null = sin datos de tiempo todavía
    weeklyAccuracy: ProStatsWeekPoint[]; // últimas 8 semanas, de la más antigua a la actual
    accuracyDeltaMonth: number | null;   // puntos % (últimos 30 días − 30 anteriores); null = sin datos suficientes
    computedAt: Date;
}
