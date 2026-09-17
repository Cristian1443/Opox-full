import type { MotorAiClient } from '../../infrastructure/clients/MotorAiClient';
import type { GetCursoIdUseCase } from './GenerateUseCases';

// ─── Fase 2 · Streaming de tests (gaps-15-09-26) ────────────────────────────
// El pipeline síncrono de generateQuestions bloquea hasta que el Motor termina
// las N preguntas (16-30 s típicos). Con streaming, el mobile recibe el jobId
// inmediatamente y hace polling — la primera pregunta puede verse en ~5 s.
//
// Estos use cases son proxies delgados: la lógica del Motor vive en MotorAiClient.
// No dependen del `AiApiContract` porque este flujo es exclusivo del Motor;
// si el Motor no está configurado, el mobile cae al flujo síncrono legacy.

export class StartTestJobUseCase {
    constructor(
        private readonly motor: MotorAiClient | undefined,
        private readonly getCursoId: GetCursoIdUseCase,
    ) {}

    async execute(input: {
        userId: string;
        oposicion: string;
        temaIds?: string[] | null;
        count: number;
        difficulty?: 'easy' | 'medium' | 'hard';
    }): Promise<{ jobId: string; sessionId: string | null }> {
        if (!this.motor) throw new Error('MOTOR_UNAVAILABLE');
        const cursoId = await this.getCursoId.execute(input.oposicion);
        return this.motor.startTestJob({
            userId: input.userId,
            cursoId,
            temaIds: input.temaIds,
            count: input.count,
            difficulty: input.difficulty,
        });
    }
}

export class GetJobStatusUseCase {
    constructor(private readonly motor: MotorAiClient | undefined) {}

    execute(jobId: string): Promise<{
        status: string;
        sessionId: string | null;
        progress: { done: number; total: number };
    }> {
        if (!this.motor) throw new Error('MOTOR_UNAVAILABLE');
        return this.motor.getJobStatus(jobId);
    }
}

export class GetSessionQuestionsUseCase {
    constructor(private readonly motor: MotorAiClient | undefined) {}

    execute(sessionId: string) {
        if (!this.motor) throw new Error('MOTOR_UNAVAILABLE');
        return this.motor.getSessionQuestions(sessionId);
    }
}

export class PostSessionAnswerUseCase {
    constructor(private readonly motor: MotorAiClient | undefined) {}

    execute(input: {
        sessionId: string;
        questionId: string;
        optionIndex: number;
        userId: string;
    }) {
        if (!this.motor) throw new Error('MOTOR_UNAVAILABLE');
        return this.motor.postSessionAnswer(input);
    }
}
