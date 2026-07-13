import type { ITrainingRepository, SaveAttemptInput } from '../../domain';
import type { TrainingAttempt, TrainingSource, TrainingDifficulty } from '../../domain/entities/TrainingAttempt';
import type { ErrorPattern } from '../../domain/entities/MockExam';

export interface SaveAttemptInput2 {
    userId: string;
    source: TrainingSource;
    mockExamId?: string;
    topicId?: string;
    difficulty?: TrainingDifficulty;
    durationSecs?: number;
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

export class SaveAttemptUseCase {
    constructor(private readonly trainingRepo: ITrainingRepository) { }

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

        return this.trainingRepo.saveAttempt(repoInput);
    }
}

export class ListErrorPatternsUseCase {
    constructor(private readonly trainingRepo: ITrainingRepository) { }

    execute(userId: string): Promise<ErrorPattern[]> {
        return this.trainingRepo.listErrorPatterns(userId);
    }
}
