import axios, { type AxiosInstance } from 'axios';
import { logger } from '@opox/utils';

// ─── Tipos internos del Motor ─────────────────────────────────────────────────

/** Pregunta devuelta por el job de placement-test (INC-04: sin correcta_idx). */
interface MotorJobQuestion {
    id: string;
    enunciado: string;
    opciones: string[];
    correcta_idx?: number;
    dificultad?: string;
    tema_id: string;
    origen?: string;
}

/** Pregunta del banco (GET /v1/courses/{id}/questions) — incluye correcta_idx. */
interface MotorBankQuestion extends MotorJobQuestion {
    correcta_idx: number;
}

interface MotorJobResponse {
    estado: 'pending' | 'processing' | 'running' | 'done' | 'error';
    resultado?: { sesion_id?: string; preguntas: MotorJobQuestion[] };
    error?: string;
}

/** Pregunta adaptada al formato que espera LevelTestInProgressScreen.js. */
export interface LevelTestQuestion {
    id: number;
    topic: string;
    topicLabel: string;
    question: string;
    options: Array<{ id: string; text: string }>;
    correct: string; // 'A' | 'B' | 'C' | 'D'
}

const IDX_TO_LETTER = ['A', 'B', 'C', 'D'] as const;

/** TTL del banco de preguntas en memoria: 10 minutos. */
const BANK_CACHE_TTL_MS = 10 * 60 * 1_000;

/**
 * Cliente HTTP para el Motor IA — onboarding (test de nivel).
 *
 * Usa POST /v1/onboarding/placement-test + polling del job para obtener
 * preguntas dinámicas seleccionadas por el Motor según el perfil del curso.
 * Para resolver correcta_idx (INC-04: el job result no lo incluye), cruza
 * los IDs con el banco del curso (/v1/courses/{id}/questions), igual que
 * MotorAiClient en los bloques de entrenamiento.
 */
export class MotorOnboardingClient {
    private readonly http: AxiosInstance;
    private readonly openAiKey: string;
    private readonly cursoId: string;

    /** Tiempo máximo (ms) para el bucle de polling del job. */
    private readonly pollTimeoutMs: number;
    /** Intervalo (ms) entre cada poll. */
    private readonly pollIntervalMs: number;

    private bankCache: Map<string, MotorBankQuestion> = new Map();
    private bankLoadedAt = 0;

    constructor(
        baseUrl: string,
        apiKey: string,
        openAiKey: string,
        cursoId = '',
        pollTimeoutMs = 60_000,
        pollIntervalMs = 3_000,
    ) {
        this.openAiKey = openAiKey;
        this.cursoId = cursoId;
        this.pollTimeoutMs = pollTimeoutMs;
        this.pollIntervalMs = pollIntervalMs;

        this.http = axios.create({
            baseURL: baseUrl.replace(/\/$/, ''),
            // Timeout por petición individual (no del polling total).
            timeout: 15_000,
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        this.http.interceptors.response.use(
            (res) => res,
            (err) => {
                logger.warn('[motor-onboarding] HTTP error', {
                    url: err.config?.url,
                    status: err.response?.status,
                    detail: err.response?.data?.detail ?? err.message,
                });
                return Promise.reject(err);
            },
        );
    }

    async getLevelTestQuestions(
        _oposicion: string,
        count = 10,
    ): Promise<LevelTestQuestion[]> {
        if (!this.cursoId) {
            throw new Error('MotorOnboardingClient: cursoId no configurado');
        }

        // 1. Iniciar el placement-test en el Motor
        logger.info('[motor-onboarding] POST /v1/onboarding/placement-test', {
            cursoId: this.cursoId,
            count,
        });

        const startRes = await this.http.post<{ job_id: string }>(
            '/v1/onboarding/placement-test',
            { curso_id: this.cursoId, user_id: 'onboarding', n_preguntas: count },
            { headers: { 'X-OpenAI-Key': this.openAiKey } },
        );

        const jobId = startRes.data?.job_id;
        if (!jobId) throw new Error('Motor no devolvió job_id para placement-test');

        // 2. Esperar a que el job complete (polling)
        const preguntas = await this.pollJob(jobId);
        if (preguntas.length === 0) throw new Error('Motor placement-test: job devolvió 0 preguntas');

        // 3. Resolver correcta_idx — si el job no lo incluye (INC-04), usar el banco
        const sinIdx = preguntas.filter((p) => typeof p.correcta_idx !== 'number');
        if (sinIdx.length > 0) {
            await this.ensureBank();
        }

        // 4. Mapear a LevelTestQuestion, descartando las que no tienen correcta_idx
        const result: LevelTestQuestion[] = [];
        for (const p of preguntas) {
            const corIdx = typeof p.correcta_idx === 'number'
                ? p.correcta_idx
                : this.bankCache.get(p.id)?.correcta_idx;

            if (typeof corIdx !== 'number') {
                logger.warn('[motor-onboarding] pregunta descartada (sin correcta_idx)', { id: p.id });
                continue;
            }

            result.push({
                id: result.length + 1,
                topic: p.tema_id,
                topicLabel: p.tema_id,
                question: p.enunciado,
                options: p.opciones.map((text, i) => ({
                    id: IDX_TO_LETTER[i] ?? String(i),
                    text,
                })),
                correct: IDX_TO_LETTER[corIdx] ?? 'A',
            });
        }

        if (result.length === 0) {
            throw new Error(
                'Motor placement-test: 0 preguntas con correcta_idx resuelto (INC-04). ' +
                'Usa el banco para resolverlo o espera fix del equipo IA.',
            );
        }

        logger.info('[motor-onboarding] placement-test ok', { count: result.length, cursoId: this.cursoId });
        return result;
    }

    // ─── Helpers privados ─────────────────────────────────────────────────────

    private async pollJob(jobId: string): Promise<MotorJobQuestion[]> {
        const deadline = Date.now() + this.pollTimeoutMs;
        let iter = 0;

        logger.info('[motor-onboarding] polling job', { jobId, timeoutMs: this.pollTimeoutMs });

        while (Date.now() < deadline) {
            await new Promise<void>((r) => setTimeout(r, this.pollIntervalMs));
            iter++;

            const res = await this.http.get<MotorJobResponse>(`/v1/jobs/${jobId}`, {
                headers: { 'X-OpenAI-Key': this.openAiKey },
            });
            const { estado, resultado, error } = res.data;

            if (estado === 'done') {
                logger.info('[motor-onboarding] job done', {
                    jobId,
                    count: resultado?.preguntas?.length ?? 0,
                    sesionId: resultado?.sesion_id,
                });
                return resultado?.preguntas ?? [];
            }

            if (estado === 'error') {
                throw new Error(`Motor placement-test job ${jobId} falló: ${error ?? 'sin detalle'}`);
            }

            if (iter % 5 === 0) {
                logger.info('[motor-onboarding] job en progreso', { jobId, iter, estado });
            }
        }

        throw new Error(`Motor placement-test job ${jobId} no completó en ${this.pollTimeoutMs}ms`);
    }

    /**
     * Carga (y cachea en memoria) el banco completo del curso.
     * Necesario para resolver correcta_idx cuando el job no lo incluye (INC-04).
     */
    private async ensureBank(): Promise<void> {
        const age = Date.now() - this.bankLoadedAt;
        if (this.bankCache.size > 0 && age < BANK_CACHE_TTL_MS) return;

        const PAGE_SIZE = 200;
        const MAX_PAGES = 50;
        const all: MotorBankQuestion[] = [];

        for (let page = 0; page < MAX_PAGES; page++) {
            const offset = page * PAGE_SIZE;
            const res = await this.http.get<MotorBankQuestion[]>(
                `/v1/courses/${this.cursoId}/questions?limit=${PAGE_SIZE}&offset=${offset}`,
                { headers: { 'X-OpenAI-Key': this.openAiKey } },
            );
            const batch = Array.isArray(res.data) ? res.data : [];
            all.push(...batch);
            if (batch.length < PAGE_SIZE) break;
        }

        this.bankCache.clear();
        for (const p of all) this.bankCache.set(p.id, p);
        this.bankLoadedAt = Date.now();

        logger.info('[motor-onboarding] banco cargado', { size: this.bankCache.size, cursoId: this.cursoId });
    }
}
