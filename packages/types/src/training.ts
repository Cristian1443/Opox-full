/**
 * Tipos compartidos del Bloque 6 · Entrenamiento.
 * Usados por el móvil y por el controller del backend.
 */

// Re-exportamos los tipos del contrato de IA para que el móvil no tenga
// que importar de '@opox/types/contracts' directamente.
export type { GeneratedQuestion, PhotoTestResult, SurgicalTestResult } from './contracts/AiApiContract';

export type TrainingSource = 'generator' | 'official' | 'surgical';
export type TrainingDifficulty = 'easy' | 'medium' | 'hard';
export type MockExamStatus = 'pending' | 'completed';

// ─── DTOs (respuestas de la API) ──────────────────────────────────────────────

export interface MockExamDTO {
    id: string;
    oposicion: string;
    year: number;
    title: string;
    category: string | null;
    questionCount: number;
    durationMinutes: number;
    penaltyRatio: number | null;
    status: MockExamStatus;
    bestScore: number | null;
    completedAt: string | null;
}

export interface ErrorPatternDTO {
    topicId: string;
    topic: string;
    totalAnswered: number;
    domain: number;
    failRate: number;
}

export interface TrainingAttemptDTO {
    id: string;
    source: TrainingSource;
    mockExamId: string | null;
    topicId: string | null;
    difficulty: TrainingDifficulty | null;
    questionCount: number;
    correctCount: number;
    wrongCount: number;
    blankCount: number;
    score: number | null;
    durationSecs: number | null;
    completedAt: string;
}

export interface TrainingBookmarkDTO {
    id: string;
    concept: string;
    question: string;
    answer: string;
    relatedTopicId: string | null;
    createdAt: string;
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface ListMocksQuery {
    oposicion: string;
}

export interface GenerateQuestionsRequest {
    oposicion: string;
    topicId?: string;
    difficulty?: TrainingDifficulty;
    count?: number;
}

export interface AnalyzePhotoRequest {
    imageBase64: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
    oposicion: string;
}

export interface GenerateSurgicalRequest {
    oposicion: string;
    count?: number;
}

export interface SaveAttemptResponseInput {
    questionId?: string;
    topicId: string;
    topic: string;
    questionText: string;
    optionsSnapshot: string[];
    correctIndex: number;
    userAnswerIndex: number | null;
    timeSecs?: number;
}

export interface SaveAttemptRequest {
    source: TrainingSource;
    mockExamId?: string;
    topicId?: string;
    difficulty?: TrainingDifficulty;
    durationSecs?: number;
    responses: SaveAttemptResponseInput[];
}

export interface SaveBookmarkRequest {
    concept: string;
    question: string;
    answer: string;
    relatedTopicId?: string;
}
