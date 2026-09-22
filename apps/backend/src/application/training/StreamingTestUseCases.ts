import type { GeneratedQuestion } from '@opox/types';
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

/**
 * Cache-first · Estrategia B (mixto cache + generador live).
 *
 * Flujo:
 * 1. Llama POST /v1/tests/from-cache en el Motor pidiendo hasta MAX_FROM_CACHE
 *    preguntas (~3 s). El cap garantiza VARIEDAD para el usuario recurrente:
 *    aunque el cache pudiera dar N cacheadas, todos los usuarios verían el
 *    mismo test cada vez. Con cap 3, las N-3 restantes siempre son generadas
 *    en directo → variedad garantizada, y el TTFP sigue siendo ~3 s (el
 *    usuario ve la primera pregunta del cache mientras el resto se genera).
 * 2. Según `publicadas` vs `count`:
 *    · pure hit (publicadas === count) → solo si count ≤ MAX_FROM_CACHE.
 *      Devuelve `questions` sin jobId → mobile navega sync. TTFP ~3 s.
 *    · partial hit (0 < publicadas < count) → devuelve `questions` +
 *      arranca job para las (count - publicadas) faltantes → mobile pinta
 *      las cacheadas al instante y useTestSession dedupe las nuevas.
 *    · pure miss (publicadas === 0) → arranca job para las N y devuelve
 *      solo `jobId` → mobile entra al flujo streaming legacy.
 * 3. Si el Motor no está configurado, el controller devuelve 503 y el mobile
 *    cae al flujo síncrono legacy.
 *
 * El use case elige él mismo si arranca el job — el controller solo hace de proxy.
 */
// Cap del parche del cliente (2026-09-22): máximo N preguntas desde el cache
// para garantizar que cada test tiene contenido nuevo. Ver comentario del
// GetCachedTestUseCase.execute para el motivo (variedad para el usuario
// recurrente). Ajustable en un solo sitio; si el Motor implementa cache con
// sampling aleatorio del pool, este cap puede subir o eliminarse.
const MAX_FROM_CACHE = 3;

export class GetCachedTestUseCase {
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
    }): Promise<{
        questions: GeneratedQuestion[];
        sessionId: string | null;
        jobId: string | null;
        pedidas: number;
        publicadas: number;
    }> {
        if (!this.motor) throw new Error('MOTOR_UNAVAILABLE');
        const cursoId = await this.getCursoId.execute(input.oposicion);

        // Cap del parche del cliente: pedimos al cache SOLO hasta MAX_FROM_CACHE
        // preguntas, no todo el count. Las restantes siempre vienen del generador
        // live → variedad garantizada. Si el usuario pide count < MAX_FROM_CACHE
        // el cap no aplica (pide lo que necesita).
        const cacheAsk = Math.min(MAX_FROM_CACHE, input.count);

        // Intento cache. Si falla la red o el Motor devuelve 500, tratamos
        // como miss total y caemos a job — no propagamos el error al mobile.
        let cache: {
            questions: GeneratedQuestion[];
            sessionId: string | null;
            pedidas: number;
            publicadas: number;
        };
        try {
            cache = await this.motor.generateFromCache({
                userId: input.userId,
                cursoId,
                temaIds: input.temaIds,
                count: cacheAsk,
                difficulty: input.difficulty,
            });
        } catch {
            cache = { questions: [], sessionId: null, pedidas: cacheAsk, publicadas: 0 };
        }

        // Pure hit — solo posible cuando count ≤ MAX_FROM_CACHE (ej.: usuario
        // pide 3 y el cache los tiene). Con count > MAX_FROM_CACHE nunca
        // entramos aquí porque cache.publicadas ≤ MAX_FROM_CACHE < count.
        if (cache.publicadas >= input.count) {
            return {
                questions: cache.questions,
                sessionId: cache.sessionId,
                jobId: null,
                pedidas: input.count,
                publicadas: cache.publicadas,
            };
        }

        // Partial hit o pure miss — arrancamos job para lo que falta.
        // count total - publicadas del cache = lo que pedimos al generador
        // live. Nunca dobla coste porque cache y generador aportan disjuntos.
        const remaining = Math.max(1, input.count - cache.publicadas);
        try {
            const job = await this.motor.startTestJob({
                userId: input.userId,
                cursoId,
                temaIds: input.temaIds,
                count: remaining,
                difficulty: input.difficulty,
            });
            return {
                questions: cache.questions,
                // Priorizamos el sessionId del JOB porque será el que sirva
                // getSessionQuestions / postSessionAnswer del hook streaming.
                // El sessionId del cache queda solo informativo (no se usa
                // para nada — las preguntas cacheadas ya vienen resueltas).
                sessionId: job.sessionId ?? cache.sessionId,
                jobId: job.jobId,
                pedidas: input.count,
                publicadas: cache.publicadas,
            };
        } catch {
            // Si el job falla, devolvemos lo que haya del cache (aunque sea 0).
            // El controller lo maneja: publicadas > 0 → mobile arranca test con
            // menos preguntas; publicadas === 0 → mobile cae a generateQuestions.
            return {
                questions: cache.questions,
                sessionId: cache.sessionId,
                jobId: null,
                pedidas: input.count,
                publicadas: cache.publicadas,
            };
        }
    }
}

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

    execute(sessionId: string, opts?: { requestedTemaIds?: string[]; jobDone?: boolean }) {
        if (!this.motor) throw new Error('MOTOR_UNAVAILABLE');
        return this.motor.getSessionQuestions(sessionId, opts);
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

/**
 * Inventario de temas (Motor v1.6.0). Informativo para el picker del Generador
 * Infinito — avisa "pocas preguntas disponibles" por tema. No afecta la
 * generación en sí; si el Motor no está configurado, el controller cae a
 * "sin datos" en lugar de 503 (no es una feature crítica del flujo de test).
 */
export class GetTopicsInventoryUseCase {
    constructor(
        private readonly motor: MotorAiClient | undefined,
        private readonly getCursoId: GetCursoIdUseCase,
    ) {}

    async execute(input: { oposicion: string | null; userId?: string }) {
        if (!this.motor) throw new Error('MOTOR_UNAVAILABLE');
        const cursoId = await this.getCursoId.execute(input.oposicion);
        return this.motor.getTopicsInventory(cursoId, input.userId);
    }
}
