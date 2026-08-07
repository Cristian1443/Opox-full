import axios, { type AxiosInstance } from 'axios';
import { logger } from '@opox/utils';
import type { MotorBoeContract } from '@opox/types';

/**
 * Cliente HTTP para el Motor BOE externo.
 *
 * Base URL: https://ingesta-demo-uadftnwmda-ue.a.run.app  (demo abierto)
 * Configurado con MOTOR_BOE_BASE_URL y MOTOR_BOE_API_KEY en apps/backend/.env.
 *
 * Autenticación:
 *   X-API-Key      → clave de servicio del Motor (vacía si el despliegue va abierto)
 *   X-OpenAI-Key   → clave OpenAI que usa el Motor para check/regenerate
 *                    (reutiliza AI_API_KEY si no se declara MOTOR_BOE_OPENAI_KEY)
 *
 * Flujo normal:
 *   1. followRegulation(cursoId, boeId)  → guarda snapshot del texto del BOE
 *   2. checkForChanges(cursoId)          → job async: compara snapshot vs BOE actual
 *   3. pollJob(jobId)                    → espera hasta estado 'done'
 *   4. getChanges(cursoId)               → lista CambioOut[] con fragmentos antes/despues
 *   5. regenerateQuestions(changeId, cursoId) → job async: reescribe preguntas afectadas
 *   6. pollJob(jobId)                    → espera resultado.regeneradas
 *
 * Colección Postman: MotorIA_Monitor_BOE.postman_collection.json
 */

export interface MotorBoeConfig {
    baseUrl: string;
    apiKey: string;
    openAiKey: string;
    timeoutMs?: number;
}

// ─── DTOs de respuesta ──────────────────────────────────────────────────────

export interface MotorBoeNorma {
    id: string;
    curso_id: string;
    identificador_boe: string;
    titulo: string;
    url: string;
    texto_len: number;
    ultima_revision: string | null;
    activa: boolean;
}

export interface MotorBoeFragmento {
    /** Texto de la redacción derogada */
    antes: string;
    /** Texto de la redacción vigente */
    despues: string;
    /** Contexto del precepto (ej. "Artículo 14. Derechos en formato electrónico") */
    contexto: string;
}

export interface MotorBoePreguntaAfectada {
    id: string;
    texto: string;
    estado: 'marcada' | 'regenerada' | 'descartada';
    similitud?: number;
}

export interface MotorBoeCambio {
    id: string;
    norma_id: string;
    norma_titulo: string;
    identificador_boe: string;
    detectado: string;
    resumen: string;
    fragmentos: MotorBoeFragmento[];
    estado: string;
    preguntas_afectadas: MotorBoePreguntaAfectada[];
    contenido_afectado: unknown[];
}

export type MotorJobEstado = 'reserved' | 'queued' | 'running' | 'done' | 'error';

export interface MotorJob {
    id: string;
    tipo: string;
    recurso_id: string;
    estado: MotorJobEstado;
    mensaje: string;
    progreso: Record<string, unknown>;
    resultado: Record<string, unknown>;
    tokens_in: number;
    tokens_out: number;
    embedding_tokens: number;
    cost_usd: number;
}

// ─── Cliente ────────────────────────────────────────────────────────────────

export class MotorBoeClient implements MotorBoeContract {
    private readonly http: AxiosInstance;

    constructor(config: MotorBoeConfig) {
        this.http = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeoutMs ?? 20_000,
            headers: {
                'X-API-Key': config.apiKey,
                'X-OpenAI-Key': config.openAiKey,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        this.http.interceptors.response.use(
            (res) => res,
            (err) => {
                logger.warn('[motor-boe] error', {
                    url: err.config?.url,
                    status: err.response?.status,
                    detail: err.response?.data?.detail ?? err.response?.data?.message ?? err.message,
                });
                return Promise.reject(err);
            },
        );
    }

    /**
     * Registra una norma en el Motor y descarga su snapshot inicial del BOE.
     * 409 si ya está en seguimiento; 422 si el identificador es inválido.
     */
    async followRegulation(
        cursoId: string,
        boeIdentifier: string,
        titulo?: string,
    ): Promise<MotorBoeNorma> {
        logger.info('[motor-boe] followRegulation', { cursoId, boeIdentifier });
        const { data } = await this.http.post<MotorBoeNorma>('/v1/boe/regulations', {
            curso_id: cursoId,
            identificador_boe: boeIdentifier,
            titulo: titulo ?? '',
        });
        return data;
    }

    /**
     * Lista las normas en seguimiento activo del curso.
     */
    async listRegulations(cursoId: string): Promise<MotorBoeNorma[]> {
        logger.info('[motor-boe] listRegulations', { cursoId });
        const { data } = await this.http.get<MotorBoeNorma[]>('/v1/boe/regulations', {
            params: { course_id: cursoId },
        });
        return data ?? [];
    }

    /**
     * Deja de seguir una norma del curso.
     */
    async stopFollowingRegulation(regulationId: string, cursoId: string): Promise<void> {
        logger.info('[motor-boe] stopFollowingRegulation', { regulationId, cursoId });
        await this.http.delete(`/v1/boe/regulations/${regulationId}`, {
            params: { course_id: cursoId },
        });
    }

    /**
     * Lanza un job de comprobación de cambios (async).
     * Pasa cursoId para limitar al curso; omitir (o pasar undefined) hace un barrido completo.
     * Devuelve el job_id para hacer polling con pollJob().
     */
    async checkForChanges(cursoId?: string): Promise<string> {
        const body = cursoId ? { curso_id: cursoId } : { todos: true };
        logger.info('[motor-boe] checkForChanges', body);
        const { data } = await this.http.post<{ job_id: string }>('/v1/boe/check', body);
        return data.job_id;
    }

    /**
     * Lista los cambios detectados para un curso, con fragmentos antes/despues.
     */
    async getChanges(cursoId: string): Promise<MotorBoeCambio[]> {
        logger.info('[motor-boe] getChanges', { cursoId });
        const { data } = await this.http.get<MotorBoeCambio[]>('/v1/boe/changes', {
            params: { course_id: cursoId },
        });
        return data ?? [];
    }

    /**
     * Lanza un job de regeneración de preguntas afectadas por un cambio (async).
     * Las preguntas regeneradas solo vuelven al banco si superan la validación completa.
     * El resultado del job incluye sesion_id del mini-test de validación.
     * Devuelve el job_id para hacer polling con pollJob().
     */
    async regenerateQuestions(changeId: string, cursoId: string): Promise<string> {
        logger.info('[motor-boe] regenerateQuestions', { changeId, cursoId });
        const { data } = await this.http.post<{ job_id: string }>(
            `/v1/boe/changes/${changeId}/regenerate`,
            { curso_id: cursoId },
        );
        return data.job_id;
    }

    /**
     * Busca normas en el catálogo del BOE por título o código.
     */
    async searchCatalog(query: string, limit = 20): Promise<MotorBoeNorma[]> {
        logger.info('[motor-boe] searchCatalog', { query });
        const { data } = await this.http.get<MotorBoeNorma[]>('/v1/boe/catalog', {
            params: { q: query, limit },
        });
        return data ?? [];
    }

    /**
     * Sondea el estado de un job async hasta que termine.
     * No hace polling por sí solo — el caller decide el intervalo.
     */
    async pollJob(jobId: string): Promise<MotorJob> {
        const { data } = await this.http.get<MotorJob>(`/v1/jobs/${jobId}`);
        return data;
    }
}
