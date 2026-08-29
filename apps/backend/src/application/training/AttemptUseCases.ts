import type { ITrainingRepository, IDashboardRepository, IStoreRepository, SaveAttemptInput } from '../../domain';
import type { TrainingAttempt, TrainingSource, TrainingDifficulty } from '../../domain/entities/TrainingAttempt';
import type { ErrorPattern } from '../../domain/entities/MockExam';

export interface SaveAttemptInput2 {
    userId: string;
    source: TrainingSource;
    mockExamId?: string;
    topicId?: string;
    difficulty?: TrainingDifficulty;
    durationSecs?: number;
    /** Fecha local del dispositivo (YYYY-MM-DD) — evita desfase de racha en TZ no-UTC. */
    localDate?: string;
    responses: Array<{
        questionId?: string;
        topicId: string;
        topic: string;
        questionText: string;
        optionsSnapshot: string[];
        correctIndex: number;
        userAnswerIndex: number | null;
        timeSecs?: number;
    }>;
}

const DAILY_TEST_CAP = 100;

export class SaveAttemptUseCase {
    constructor(
        private readonly trainingRepo: ITrainingRepository,
        private readonly dashboardRepo: IDashboardRepository,
        private readonly storeRepo: IStoreRepository,
    ) { }

    async execute(input: SaveAttemptInput2): Promise<TrainingAttempt> {
        const correctCount = input.responses.filter((r) => r.userAnswerIndex === r.correctIndex).length;
        const blankCount = input.responses.filter((r) => r.userAnswerIndex === null).length;
        const wrongCount = input.responses.length - correctCount - blankCount;
        const questionCount = input.responses.length;

        // Para simulacros oficiales calculamos nota con penalización;
        // el penalty_ratio lo tiene el mockExam — por ahora 0.33 si es 'official'
        const penaltyRatio = input.source === 'official' ? 0.33 : 0;
        const rawScore = correctCount - wrongCount * penaltyRatio;
        const score = parseFloat(
            Math.max(0, (rawScore / questionCount) * 10).toFixed(2),
        );

        const repoInput: SaveAttemptInput = {
            userId: input.userId,
            source: input.source,
            mockExamId: input.mockExamId,
            topicId: input.topicId,
            difficulty: input.difficulty,
            questionCount,
            correctCount,
            wrongCount,
            blankCount,
            score,
            durationSecs: input.durationSecs,
            responses: input.responses,
        };

        // Opopoints: 1 punto por respuesta correcta × multiplicador de nota,
        // con cap diario de DAILY_TEST_CAP para evitar farming de tests cortos.
        const pct = questionCount > 0 ? (correctCount / questionCount) * 100 : 0;
        const multiplier = pct >= 80 ? 1.5 : pct >= 60 ? 1.2 : 1.0;
        const rawEarned = Math.round(correctCount * multiplier);
        const todayEarned = rawEarned > 0
            ? await this.storeRepo.getTodayTestEarnings(input.userId)
            : 0;
        const earnedPoints = Math.min(rawEarned, Math.max(0, DAILY_TEST_CAP - todayEarned));

        const [attempt] = await Promise.all([
            this.trainingRepo.saveAttempt(repoInput),
            this.dashboardRepo.registerActivity({
                userId: input.userId,
                reason: 'test_completed',
                points: earnedPoints,
                localDate: input.localDate,
            }),
        ]);

        return attempt;
    }
}

export class ListErrorPatternsUseCase {
    constructor(private readonly trainingRepo: ITrainingRepository) { }

    execute(userId: string): Promise<ErrorPattern[]> {
        return this.trainingRepo.listErrorPatterns(userId);
    }
}
