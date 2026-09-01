import axios, { type AxiosInstance } from 'axios';
import { logger } from '@opox/utils';
import type { MotorBoeContract, MotorBoeNorma, MotorBoeCatalogResult } from '@opox/types';

/**
 * Cliente HTTP para el Motor BOE externo.
 *
 * Base URL: https://ingesta-demo.onrender.com  (Render, host consolidado con Motor RAG desde 2026-08-18)
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

// ─── DTO interno del job (más rico que MotorJobStatus del contrato) ──────────

interface MotorJobFull {
    id: string;
    tipo: string;
    recurso_id: string;
    estado: string;
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

    /** Registra una norma en el Motor. 409 si ya está en seguimiento. */
    async followRegulation(cursoId: string, boeIdentifier: string, titulo?: string): Promise<MotorBoeNorma> {
        logger.info('[motor-boe] followRegulation', { cursoId, boeIdentifier });
        const { data } = await this.http.post<MotorBoeNorma>('/v1/boe/regulations', {
            curso_id: cursoId,
            identificador_boe: boeIdentifier,
            titulo: titulo ?? '',
        });
        return data;
    }

    /** Lista normas en seguimiento activo para el curso. */
    async listRegulations(cursoId: string): Promise<MotorBoeNorma[]> {
        logger.info('[motor-boe] listRegulations', { cursoId });
        const { data } = await this.http.get<MotorBoeNorma[]>('/v1/boe/regulations', {
            params: { course_id: cursoId },
        });
        return data ?? [];
    }

    /** Deja de seguir una norma. motorRegulationId = id del Motor (NormaOut.id). */
    async stopFollowingRegulation(motorRegulationId: string, cursoId: string): Promise<void> {
        logger.info('[motor-boe] stopFollowingRegulation', { motorRegulationId, cursoId });
        await this.http.delete(`/v1/boe/regulations/${motorRegulationId}`, {
            params: { course_id: cursoId },
        });
    }

    /** Lanza job de detección de cambios. Sin cursoId hace barrido global. Devuelve job_id. */
    async checkForChanges(cursoId?: string): Promise<string> {
        const body = cursoId ? { curso_id: cursoId } : { todos: true };
        logger.info('[motor-boe] checkForChanges', body);
        const { data } = await this.http.post<{ job_id: string }>('/v1/boe/check', body);
        return data.job_id;
    }

    /** Lista los cambios detectados para un curso (course_id requerido en el Motor). */
    async getChanges(cursoId: string): Promise<import('@opox/types').MotorCambio[]> {
        logger.info('[motor-boe] getChanges', { cursoId });
        const { data } = await this.http.get<import('@opox/types').MotorCambio[]>('/v1/boe/changes', {
            params: { course_id: cursoId },
        });
        return data ?? [];
    }

    /** Lanza job de regeneración de preguntas afectadas por un cambio. Devuelve job_id. */
    async regenerateQuestions(changeId: string, cursoId: string): Promise<string> {
        logger.info('[motor-boe] regenerateQuestions', { changeId, cursoId });
        const { data } = await this.http.post<{ job_id: string }>(
            `/v1/boe/changes/${changeId}/regenerate`,
            { curso_id: cursoId },
        );
        return data.job_id;
    }

    /**
     * Busca normas en el catálogo BOE.
     * El Motor devuelve CatalogoOut ({ sincronizado, total, resultados: [] }).
     */
    async searchCatalog(query: string, limit = 20): Promise<MotorBoeCatalogResult> {
        logger.info('[motor-boe] searchCatalog', { query });
        const { data } = await this.http.get<MotorBoeCatalogResult>('/v1/boe/catalog', {
            params: { q: query, limit },
            timeout: 5_000, // Timeout corto: si el catálogo tarda, cae al fallback de listRegulations
        });
        return data ?? { sincronizado: false, total: 0, ultima_sincronizacion: null, resultados: [] };
    }

    /**
     * Sincroniza el catálogo del BOE oficial en el Motor (async).
     * `desde`: fecha YYYYMMDD desde la que buscar cambios.
     * Devuelve job_id para polling.
     */
    async syncCatalog(desde?: string): Promise<string> {
        logger.info('[motor-boe] syncCatalog', { desde });
        const body = desde ? { desde } : {};
        const { data } = await this.http.post<{ job_id: string }>('/v1/boe/catalog/sync', body);
        return data.job_id;
    }

    /** Sondea el estado de un job. No hace polling interno — el caller decide el intervalo. */
    async pollJob(jobId: string): Promise<import('@opox/types').MotorJobStatus> {
        const { data } = await this.http.get<MotorJobFull>(`/v1/jobs/${jobId}`);
        return { id: data.id, estado: data.estado as import('@opox/types').MotorJobEstado, mensaje: data.mensaje };
    }
}
