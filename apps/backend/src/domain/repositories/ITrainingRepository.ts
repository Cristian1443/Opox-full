import type { GeneratedQuestion } from '@opox/types';
import type { MockExam, MockExamWithStatus, ErrorPattern } from '../entities/MockExam';
import type { TrainingAttempt, TrainingSource, TrainingDifficulty } from '../entities/TrainingAttempt';
import type { TrainingBookmark } from '../entities/TrainingBookmark';

export interface SaveAttemptInput {
    userId: string;
    source: TrainingSource;
    mockExamId?: string;
    topicId?: string;
    difficulty?: TrainingDifficulty;
    questionCount: number;
    correctCount: number;
    wrongCount: number;
    blankCount: number;
    score: number | null;
    durationSecs?: number;
    responses: ResponseInput[];
}

export interface ResponseInput {
    questionId?: string;
    topicId: string;
    topic: string;
    questionText: string;
    optionsSnapshot: string[];
    correctIndex: number;
    userAnswerIndex: number | null;
    timeSecs?: number;
}

/** Contrato del repositorio del Bloque 6 · Entrenamiento. */
export interface ITrainingRepository {
    // ─── Simulacros ───────────────────────────────
    listMockExams(input: { oposicion: string; userId: string }): Promise<MockExamWithStatus[]>;
    getMockExam(id: string): Promise<MockExam | null>;
    /** Preguntas de un simulacro oficial cargadas en DB (vacío hasta que se importen). */
    listMockQuestions(mockExamId: string): Promise<GeneratedQuestion[]>;

    // ─── Intentos ─────────────────────────────────
    saveAttempt(input: SaveAttemptInput): Promise<TrainingAttempt>;

    // ─── Patrones de error ────────────────────────
    /** Lee la vista training_error_patterns, ya filtrada por user_id. */
    listErrorPatterns(userId: string): Promise<ErrorPattern[]>;

    // ─── Bookmarks (Foto-Test) ────────────────────
    listBookmarks(userId: string): Promise<TrainingBookmark[]>;
    saveBookmark(input: {
        userId: string;
        concept: string;
        question: string;
        answer: string;
        relatedTopicId?: string;
    }): Promise<TrainingBookmark>;
    deleteBookmark(input: { userId: string; bookmarkId: string }): Promise<void>;
}
