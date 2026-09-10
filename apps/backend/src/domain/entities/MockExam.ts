export class MockExam {
    private constructor(
        public readonly id: string,
        public readonly oposicion: string,
        public readonly year: number,
        public readonly title: string,
        public readonly category: string | null,
        public readonly questionCount: number,
        public readonly durationMinutes: number,
        public readonly penaltyRatio: number | null,
        public readonly createdAt: Date,
    ) { }

    static create(props: {
        id: string;
        oposicion: string;
        year: number;
        title: string;
        category?: string | null;
        questionCount: number;
        durationMinutes: number;
        penaltyRatio?: number | null;
        createdAt?: Date;
    }): MockExam {
        return new MockExam(
            props.id,
            props.oposicion,
            props.year,
            props.title,
            props.category ?? null,
            props.questionCount,
            props.durationMinutes,
            props.penaltyRatio ?? null,
            props.createdAt ?? new Date(),
        );
    }
}

/** Simulacro enriquecido con el estado del usuario (calculado en el repositorio). */
export interface MockExamWithStatus {
    exam: MockExam;
    /** 'pending' si el usuario aún no lo ha completado, 'completed' si lo ha terminado. */
    status: 'pending' | 'completed';
    bestScore: number | null;
    completedAt: Date | null;
}

/** Patrón de error calculado desde training_attempt_responses (sin IA). */
export interface ErrorPattern {
    topicId: string;
    topic: string;
    totalAnswered: number;
    totalCorrect: number;
    totalWrong: number;
    /** Porcentaje de dominio 0–100 */
    domain: number;
    /** Porcentaje de fallo 0–100 */
    failRate: number;
}

/**
 * Progreso guardado de un simulacro oficial en curso — permite retomarlo
 * exactamente donde se dejó (2.2 "¿Seguimos con el simulacro?"). Una sola
 * fila por usuario: solo puede haber un simulacro activo a la vez.
 */
export interface MockExamProgress {
    mockExamId: string;
    examTitle: string;
    currentIndex: number;
    questionCount: number;
    /** Respuestas ya dadas, en el mismo formato que maneja QuestionActiveScreen — opaco para el backend. */
    answers: unknown[];
    updatedAt: Date;
}

/** Última ley/artículo que el usuario consultó (2.2 "Última ley consultada"). */
export interface LawView {
    law: string;
    article: string | null;
    articleTitle: string | null;
    boeUrl: string | null;
    topicId: string | null;
    viewedAt: Date;
}
