import type { GeneratedQuestion } from '@opox/types';
import type { MockExam, MockExamWithStatus, ErrorPattern, MockExamProgress, LawView } from '../entities/MockExam';
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
    // ─── Multi-curso ──────────────────────────────
    /** Devuelve el motor_curso_id para la oposición dada, o null si no está en training_courses. */
    getCursoId(oposicion: string): Promise<string | null>;

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

    // ─── Reportes y valoraciones de preguntas ─────
    reportQuestion(input: {
        userId: string;
        questionId: string;
        reason: string;
        details?: string;
    }): Promise<void>;
    /** Upsert por (userId, questionId) — recalificar sobreescribe la valoración anterior. */
    rateQuestion(input: {
        userId: string;
        questionId: string;
        rating: number;
    }): Promise<{ questionId: string; rating: number }>;

    // ─── Progreso de simulacro (resume) ───────────
    /** Upsert — solo puede haber un simulacro en curso por usuario. */
    saveMockProgress(input: {
        userId: string;
        mockExamId: string;
        examTitle: string;
        currentIndex: number;
        questionCount: number;
        answers: unknown[];
    }): Promise<void>;
    getMockProgress(userId: string): Promise<MockExamProgress | null>;
    clearMockProgress(userId: string): Promise<void>;

    // ─── Última ley consultada ─────────────────────
    /** Upsert — solo se guarda la más reciente por usuario. */
    saveLawView(input: {
        userId: string;
        law: string;
        article?: string;
        articleTitle?: string;
        boeUrl?: string;
        topicId?: string;
    }): Promise<void>;
    getLastLawView(userId: string): Promise<LawView | null>;
}
