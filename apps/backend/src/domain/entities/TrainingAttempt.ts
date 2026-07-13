export type TrainingSource = 'generator' | 'official' | 'surgical';
export type TrainingDifficulty = 'easy' | 'medium' | 'hard';

/** Sesión de test completada por el usuario. */
export class TrainingAttempt {
    private constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly source: TrainingSource,
        public readonly mockExamId: string | null,
        public readonly topicId: string | null,
        public readonly difficulty: TrainingDifficulty | null,
        public readonly questionCount: number,
        public readonly correctCount: number,
        public readonly wrongCount: number,
        public readonly blankCount: number,
        /** Nota final 0–10 calculada con la penalización del simulacro (si aplica). */
        public readonly score: number | null,
        public readonly durationSecs: number | null,
        public readonly completedAt: Date,
        public readonly createdAt: Date,
    ) { }

    static create(props: {
        id: string;
        userId: string;
        source: TrainingSource;
        mockExamId?: string | null;
        topicId?: string | null;
        difficulty?: TrainingDifficulty | null;
        questionCount: number;
        correctCount: number;
        wrongCount: number;
        blankCount: number;
        score?: number | null;
        durationSecs?: number | null;
        completedAt?: Date;
        createdAt?: Date;
    }): TrainingAttempt {
        return new TrainingAttempt(
            props.id,
            props.userId,
            props.source,
            props.mockExamId ?? null,
            props.topicId ?? null,
            props.difficulty ?? null,
            props.questionCount,
            props.correctCount,
            props.wrongCount,
            props.blankCount,
            props.score ?? null,
            props.durationSecs ?? null,
            props.completedAt ?? new Date(),
            props.createdAt ?? new Date(),
        );
    }
}
