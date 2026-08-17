export interface ProStatsTopicRow {
    topicId: string;
    topic: string;
    total: number;
    correct: number;
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
    computedAt: Date;
}
