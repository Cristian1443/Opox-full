/**
 * Tipos compartidos del Bloque 6 · Entrenamiento.
 * Usados por el móvil y por el controller del backend.
 */

// Re-exportamos los tipos del contrato de IA para que el móvil no tenga
// que importar de '@opox/types/contracts' directamente.
export type { GeneratedQuestion, PhotoTestResult, SurgicalTestResult, HintResult } from './contracts/AiApiContract';
import type { GeneratedQuestion } from './contracts/AiApiContract';

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
    /** ISO 8601 — fecha del último intento registrado para este tema */
    lastAttemptDate: string;
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
    /** Fecha local del dispositivo (YYYY-MM-DD) para calcular la racha correctamente en TZ no-UTC. */
    localDate?: string;
    responses: SaveAttemptResponseInput[];
}

export interface SaveBookmarkRequest {
    concept: string;
    question: string;
    answer: string;
    relatedTopicId?: string;
}

export interface HintRequest {
    questionId: string;
    questionText: string;
    options: [string, string, string, string];
    topicId: string;
    topic: string;
    oposicion: string;
}

export type ReportReason = 'wrong_answer' | 'poor_wording' | 'outdated_law' | 'other';

export interface ReportQuestionRequest {
    reason: ReportReason;
    details?: string;
}

export interface RateQuestionRequest {
    rating: number;
}

// ─── Progreso de simulacro (resume) ────────────────────────────────────────────

export interface SaveMockProgressRequest {
    mockExamId: string;
    examTitle: string;
    currentIndex: number;
    questionCount: number;
    /** Mismo formato que maneja QuestionActiveScreen — opaco para el backend. */
    answers: unknown[];
}

export interface MockProgressDTO {
    mockExamId: string;
    examTitle: string;
    currentIndex: number;
    questionCount: number;
    answers: unknown[];
    updatedAt: string;
}

// ─── Última ley consultada ──────────────────────────────────────────────────────

export interface SaveLawViewRequest {
    law: string;
    article?: string;
    articleTitle?: string;
    boeUrl?: string;
    topicId?: string;
}

export interface RateQuestionResponse {
    questionId: string;
    rating: number;
}

// ─── Banco de exámenes oficiales (Bloque 6.6 · Motor IA) ──────────────────────

export type BankExamSource = 'oficial' | 'profesor' | 'otro';

export interface BankExamDTO {
    id: string;
    cursoId: string;
    titulo: string;
    anio: number;
    fuente: BankExamSource;
    nPreguntas: number;
    /** Historial del usuario sobre este examen (enriquecido en backend). */
    status: 'pending' | 'completed';
    /** Mejor score obtenido (0-10) o null si no lo ha completado. */
    bestScore: number | null;
    /** ISO 8601 de la última vez que lo completó. */
    completedAt: string | null;
    /** Nº de veces que lo ha intentado. */
    attemptCount: number;
}

export interface UploadBankExamRequest {
    titulo: string;
    anio: number;
    fuente: BankExamSource;
    file: {
        base64: string;
        mimeType: string;
        fileName?: string;
    };
}

export interface UploadBankExamResponse {
    jobId: string;
}

export interface BankExamJobResult {
    examenId?: string;
    extraidas?: number;
    guardadas?: number;
    duplicadas?: number;
    descartadas?: number;
    sinTema?: number;
    yaIncorporado?: boolean;
    corte?: string;
}

/**
 * Estados del Motor: `reserved | queued | running | done | error`.
 * Verificado en /openapi.json 2026-09-17.
 */
export type BankExamJobStatusEnum = 'reserved' | 'queued' | 'running' | 'done' | 'error';

export interface BankExamJobStatus {
    status: BankExamJobStatusEnum;
    /** Mensaje humano del Motor (por ej. progreso: "OCR página 3 de 60…"). */
    message?: string;
    result?: BankExamJobResult;
    error?: string;
    /** Coste real del job en USD (viene en el root del JobOut, no en `resultado`). */
    costUsd?: number;
}

export interface StartBankMockRequest {
    /** Opcional — si viene, el simulacro se compone SOLO con preguntas de ese examen del banco. */
    examId?: string;
    /** true = solo preguntas de exámenes con fuente 'oficial'. */
    soloOficiales?: boolean;
    /** 5–100. Ignorado si viene `distribucion`. */
    nPreguntas?: number;
    /** 0 = sin límite. */
    contrarrelojSeg?: number;
    /** Distribución por tema: `{tema_id: cantidad}`. Cuando viene, se ignora `nPreguntas`. */
    distribucion?: Record<string, number>;
}

export interface StartBankMockResponse {
    sesionId: string;
    questions: GeneratedQuestion[];
    contrarrelojSeg: number;
    deficit?: {
        pedidas: number;
        publicadas: number;
        motivosDescarte?: Record<string, number>;
    };
}

/**
 * Resultado agregado de un simulacro (schema `ResultadoSesionOut` del Motor).
 * No incluye detalle pregunta-a-pregunta — la corrección de cada pregunta ya
 * llega en tiempo real vía POST /v1/tests/{id}/answer.
 * Verificado en /openapi.json 2026-09-17.
 */
export interface BankMockTopicResult {
    temaId: string;
    temaTitulo: string;
    aciertos: number;
    fallos: number;
}

export interface BankMockResultDTO {
    sesionId: string;
    respondidas: number;
    total: number;
    aciertos: number;
    /** Nota en el rango que el Motor decida (típicamente 0-10 o 0-100). */
    notaPct: number;
    tiempoTotalMs: number;
    porTema: BankMockTopicResult[];
}
