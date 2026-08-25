import axios, { type AxiosInstance } from 'axios';
import type {
    AiApiContract,
    GenerateQuestionsParams,
    GeneratedQuestion,
    AnalyzePhotoParams,
    PhotoTestResult,
    GenerateSurgicalTestParams,
    SurgicalTestResult,
    HintParams,
    HintResult,
    AnalyzeNoteDocumentParams,
    AnalyzeNoteDocumentResult,
    GenerateTagsFromNoteParams,
    GenerateTagsFromNoteResult,
    GenerateQuestionsFromNoteParams,
    GenerateQuestionsFromNoteResult,
    GenerateBoeMiniTestParams,
    BoeMiniTestAiResult,
} from '@opox/types';
import { logger } from '@opox/utils';

export interface MotorAiConfig {
    baseUrl: string;
    apiKey: string;
    /** Clave OpenAI que el Motor usa para las llamadas LLM (X-OpenAI-Key). */
    openAiKey: string;
    timeoutMs: number;
    /** Milliseconds entre polls al endpoint /v1/jobs/{id}. Default 3000ms. */
    pollIntervalMs?: number;
    /** Timeout total del polling en ms. Default 120 000ms. */
    pollTimeoutMs?: number;
    /**
     * ID del curso principal ingestado en el Motor.
     * Mientras no exista la tabla Supabase training_courses (mapeo oposicion → curso_id),
     * este valor es la única forma de saber qué curso usar.
     */
    defaultCursoId?: string;
}

// ─── Tipos internos del Motor ─────────────────────────────────────────────────

/**
 * Schema del Motor en /v1/tests/generate (job resultado).
 * correcta_idx y explicacion son opcionales — presentes cuando INC-04 esté resuelto.
 * origen: "generada" indica que el Motor generó la pregunta con LLM (no del banco),
 * lo que significa que el ID no existirá en /v1/courses/{id}/questions.
 */
interface MotorPreguntaJob {
    id: string;
    enunciado: string;
    opciones: string[];
    dificultad: string;
    tema_id: string;
    origen?: string;
    ref_legislativa?: string;
    // INC-04: el equipo IA añadirá estos campos al job result.
    // Ya tipados aquí para usarlos directamente cuando estén disponibles.
    correcta_idx?: number;
    explicacion?: string;
}

/**
 * Schema completo de /v1/courses/{curso_id}/questions — incluye correcta_idx
 * y explicacion que el job no expone (INC-04: bloqueante reportado al equipo IA).
 */
interface MotorPreguntaFull extends MotorPreguntaJob {
    correcta_idx: number;
    explicacion?: string;
    evidencia?: { cita: string; pagina: number };
    justificaciones?: string[];
}

interface MotorJobResponse {
    job_id?: string;
    estado: 'pending' | 'processing' | 'running' | 'done' | 'error';
    resultado?: { sesion_id: string; preguntas: MotorPreguntaJob[] };
    error?: string;
}

// ─── Helpers de mapeo ────────────────────────────────────────────────────────

const DIFF_TO_MOTOR: Record<string, string> = {
    easy: 'facil',
    medium: 'media',
    hard: 'dificil',
};

const DIFF_FROM_MOTOR: Record<string, 'easy' | 'medium' | 'hard'> = {
    facil: 'easy',
    media: 'medium',
    dificil: 'hard',
};

/**
 * Cliente HTTP para el Motor de IA del cliente (RAG + generación con
 * evidencia verbatim del temario oficial). URL de producción:
 * https://ingesta-demo.onrender.com
 *
 * Cubre generateQuestions y generateSurgicalTest vía los endpoints
 * /v1/tests/generate + /v1/jobs/{job_id}. Los métodos analyzePhoto,
 * generateHint y los de Bloques 9/10 NO están en su alcance — delegar
 * en AiApiClient (OpenAI) a través de CompositeAiClient.
 *
 * Ver packages/ai/MOTOR_INTEGRATION.md para el detalle de la integración.
 */
export class MotorAiClient implements AiApiContract {
    private readonly http: AxiosInstance;
    private readonly config: MotorAiConfig;

    /**
     * Caché del banco de preguntas del curso.
     * GET /v1/courses/{curso_id}/questions devuelve correcta_idx y explicacion
     * que el job result no incluye (INC-04 — pendiente de resolución por equipo IA).
     */
    private questionBankCache: Map<string, MotorPreguntaFull> = new Map();
    private questionBankLoadedAt = 0;
    private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

    constructor(config: MotorAiConfig) {
        this.config = config;
        this.http = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeoutMs,
            headers: {
                'X-API-Key': config.apiKey,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        this.http.interceptors.response.use(
            (res) => res,
            (err) => {
                logger.warn('[motor-ai] error', {
                    url: err.config?.url,
                    status: err.response?.status,
                    detail: err.response?.data?.detail ?? err.message,
                });
                return Promise.reject(err);
            },
        );
    }

    // ─── generateQuestions ────────────────────────────────────────────────────

    async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
        const cursoId = this.config.defaultCursoId;
        if (!cursoId) {
            throw new Error(
                '[MotorAiClient] MOTOR_DEFAULT_CURSO_ID no configurado. ' +
                'Rellenar la variable en .env con el ID del curso ingestado en el Motor.',
            );
        }

        // 'all' → null (todo el temario). Múltiple selección separada por coma → array.
        // Nota: los topicIds de OPOX son semánticos ('constitucion', 'ley-39') pero
        // los tema_ids del Motor son UUIDs del PDF parseado. Hasta que exista la tabla
        // training_courses_topics con el mapeo, enviamos null (all) y el Motor elige.
        const temaIds: string[] | null =
            params.topicId === 'all'
                ? null
                : null; // TODO(motor-topics): mapear topicId → tema_ids del Motor

        if (params.topicId !== 'all') {
            logger.warn('[motor-ai] topicId ignorado — mapeo de temas pendiente', {
                topicId: params.topicId,
            });
        }

        const body = {
            curso_id: cursoId,
            user_id: 'opox-backend',
            tema_ids: temaIds,
            n_preguntas: params.count,
            dificultad: DIFF_TO_MOTOR[params.difficulty] ?? 'media',
        };

        logger.info('[motor-ai] POST /v1/tests/generate', {
            cursoId,
            count: params.count,
            difficulty: body.dificultad,
        });

        const res = await this.http.post<unknown>('/v1/tests/generate', body, {
            headers: { 'X-OpenAI-Key': this.config.openAiKey },
            // El Motor puede devolver 200 (from-cache) o 202 (async job)
            validateStatus: (s) => s === 200 || s === 202,
        });

        const data = res.data as Record<string, unknown>;

        let preguntas: MotorPreguntaJob[];
        if (res.status === 200) {
            // Respuesta síncrona desde caché
            preguntas = (data.preguntas as MotorPreguntaJob[] | undefined) ?? [];
        } else {
            // 202 — generación asíncrona, hacer polling del job
            const jobId = data.job_id as string;
            preguntas = await this.pollJobForPreguntas(jobId);
        }

        // Caso A (INC-04 resuelto): el job ya incluye correcta_idx en todas las preguntas.
        // Caso B (INC-04 pendiente): las preguntas son origen="generada" sin correcta_idx.
        //   → Fail-fast si NINGUNA tiene correcta_idx (evita cargar el banco en vano).
        const todasGeneradasSinIdx = preguntas.every(
            (p) => p.origen === 'generada' && typeof p.correcta_idx !== 'number',
        );
        if (todasGeneradasSinIdx && preguntas.length > 0) {
            throw new Error(
                '[MotorAiClient] todas las preguntas son origen="generada" sin correcta_idx (INC-04). ' +
                'CompositeAiClient debe hacer fallback a OpenAI.',
            );
        }

        // Separar las que ya traen correcta_idx en el job de las que necesitan el banco.
        const conIdx = preguntas.filter((p) => typeof p.correcta_idx === 'number');
        const sinIdx = preguntas.filter((p) => typeof p.correcta_idx !== 'number');

        // Cargar el banco solo si hay preguntas sin correcta_idx que puedan estar en él.
        if (sinIdx.length > 0) {
            await this.ensureQuestionBank();
        }

        const mapped: GeneratedQuestion[] = [];
        let droppedNoAnswer = 0;

        // Preguntas que ya traen correcta_idx: mapear directamente.
        for (const p of conIdx) {
            mapped.push(this.mapPregunta(p, p as unknown as MotorPreguntaFull));
        }

        // Preguntas sin correcta_idx: buscar en banco por id (workaround INC-04).
        for (const p of sinIdx) {
            const full = this.questionBankCache.get(p.id);
            if (!full || typeof full.correcta_idx !== 'number') {
                droppedNoAnswer++;
                continue;
            }
            mapped.push(this.mapPregunta(p, full));
        }

        if (droppedNoAnswer > 0) {
            logger.warn('[motor-ai] preguntas descartadas sin correcta_idx', {
                dropped: droppedNoAnswer,
                kept: mapped.length,
                total: preguntas.length,
            });
        }

        if (mapped.length === 0) {
            throw new Error(
                '[MotorAiClient] el Motor devolvió 0 preguntas con correcta_idx conocido (INC-04). ' +
                'CompositeAiClient debe hacer fallback a OpenAI.',
            );
        }

        return mapped;
    }

    // ─── generateSurgicalTest ─────────────────────────────────────────────────

    async generateSurgicalTest(params: GenerateSurgicalTestParams): Promise<SurgicalTestResult> {
        // El Motor no tiene endpoint /v1/tests/surgical todavía.
        // Generamos desde el curso completo y calculamos la distribución
        // esperada a partir de los failRate del usuario.
        const questions = await this.generateQuestions({
            oposicion: params.oposicion,
            topicId: 'all',
            difficulty: 'medium',
            count: params.count,
        });

        const totalFailRate =
            params.errorPatterns.reduce((s, p) => s + p.failRate, 0) || 1;

        const distribution = params.errorPatterns.map((p) => ({
            topicId: p.topicId,
            topic: p.topic,
            count: Math.round((p.failRate / totalFailRate) * params.count),
            percentage: Math.round((p.failRate / totalFailRate) * 100),
        }));

        return { questions, distribution };
    }

    // ─── Métodos que el Motor NO cubre ────────────────────────────────────────
    // CompositeAiClient enruta estos métodos al cliente OpenAI directo.
    // Nunca se deberían llamar aquí en producción.

    async analyzePhoto(_params: AnalyzePhotoParams): Promise<PhotoTestResult> {
        throw new Error('[MotorAiClient] analyzePhoto no forma parte del Motor. Usa CompositeAiClient.');
    }

    async generateHint(_params: HintParams): Promise<HintResult> {
        throw new Error('[MotorAiClient] generateHint no forma parte del Motor. Usa CompositeAiClient.');
    }

    async analyzeNoteDocument(_params: AnalyzeNoteDocumentParams): Promise<AnalyzeNoteDocumentResult> {
        throw new Error('[MotorAiClient] analyzeNoteDocument no forma parte del Motor. Usa CompositeAiClient.');
    }

    async generateTagsFromNote(_params: GenerateTagsFromNoteParams): Promise<GenerateTagsFromNoteResult> {
        throw new Error('[MotorAiClient] generateTagsFromNote no forma parte del Motor. Usa CompositeAiClient.');
    }

    async generateQuestionsFromNote(_params: GenerateQuestionsFromNoteParams): Promise<GenerateQuestionsFromNoteResult> {
        throw new Error('[MotorAiClient] generateQuestionsFromNote no forma parte del Motor. Usa CompositeAiClient.');
    }

    async generateBoeMiniTest(_params: GenerateBoeMiniTestParams): Promise<BoeMiniTestAiResult> {
        throw new Error('[MotorAiClient] generateBoeMiniTest no forma parte del Motor. Usa CompositeAiClient.');
    }

    // ─── Helpers privados ─────────────────────────────────────────────────────

    private async pollJobForPreguntas(jobId: string): Promise<MotorPreguntaJob[]> {
        const interval = this.config.pollIntervalMs ?? 3_000;
        const timeout = this.config.pollTimeoutMs ?? 240_000;
        const deadline = Date.now() + timeout;
        const startedAt = Date.now();

        logger.info('[motor-ai] polling job', { jobId, timeoutMs: timeout });

        let iter = 0;
        while (Date.now() < deadline) {
            await new Promise<void>((r) => setTimeout(r, interval));
            iter++;

            const job = await this.http.get<MotorJobResponse>(`/v1/jobs/${jobId}`);
            const { estado, resultado, error } = job.data;

            if (estado === 'done') {
                const first = resultado?.preguntas?.[0] as Record<string, unknown> | undefined;
                logger.info('[motor-ai] job done', {
                    jobId,
                    count: resultado?.preguntas?.length,
                    elapsedMs: Date.now() - startedAt,
                    sesionId: resultado?.sesion_id,
                    firstKeys: first ? Object.keys(first) : [],
                    firstSample: first,
                });
                return resultado?.preguntas ?? [];
            }

            if (estado === 'error') {
                throw new Error(`[MotorAiClient] job ${jobId} falló en el Motor: ${error}`);
            }

            // Log cada ~15s (5 polls * 3s) para tener visibilidad del progreso.
            if (iter % 5 === 0) {
                logger.info('[motor-ai] job en progreso', {
                    jobId,
                    estado,
                    elapsedMs: Date.now() - startedAt,
                });
            }
        }

        throw new Error(`[MotorAiClient] job ${jobId} no completó en ${timeout}ms`);
    }

    /**
     * Carga (y cachea) el banco completo de preguntas del curso.
     * GET /v1/courses/{curso}/questions devuelve correcta_idx y explicacion
     * que el job result no incluye (INC-04).
     */
    private async ensureQuestionBank(): Promise<void> {
        const cursoId = this.config.defaultCursoId;
        if (!cursoId) return;

        const age = Date.now() - this.questionBankLoadedAt;
        if (this.questionBankCache.size > 0 && age < this.CACHE_TTL_MS) return;

        try {
            // El Motor limita `limit` a 200 por página, así que hay que paginar.
            const PAGE_SIZE = 200;
            const MAX_PAGES = 50; // salvavidas: 10k preguntas máximo
            const preguntas: MotorPreguntaFull[] = [];
            for (let page = 0; page < MAX_PAGES; page++) {
                const offset = page * PAGE_SIZE;
                const res = await this.http.get<MotorPreguntaFull[]>(
                    `/v1/courses/${cursoId}/questions?limit=${PAGE_SIZE}&offset=${offset}`,
                    { headers: { 'X-OpenAI-Key': this.config.openAiKey } },
                );
                const batch = Array.isArray(res.data) ? res.data : [];
                preguntas.push(...batch);
                if (batch.length < PAGE_SIZE) break;
            }
            this.questionBankCache.clear();
            for (const p of preguntas) {
                this.questionBankCache.set(p.id, p);
            }
            this.questionBankLoadedAt = Date.now();
            logger.info('[motor-ai] question bank cargado', { count: preguntas.length, cursoId });
        } catch (err) {
            logger.warn('[motor-ai] no se pudo cargar el question bank — correcta_idx no disponible', {
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    private mapPregunta(p: MotorPreguntaJob, full: MotorPreguntaFull): GeneratedQuestion {
        // p.correcta_idx toma precedencia cuando el job ya lo incluye (INC-04 resuelto).
        // En caso contrario se usa full.correcta_idx del banco (workaround INC-04).
        const correcta_idx = typeof p.correcta_idx === 'number' ? p.correcta_idx : full.correcta_idx;
        return {
            id: p.id,
            text: p.enunciado,
            options: p.opciones as [string, string, string, string],
            correctIndex: correcta_idx as 0 | 1 | 2 | 3,
            explanation: p.explicacion ?? full.explicacion ?? '',
            topicId: p.tema_id,
            topic: p.tema_id,
            difficulty: DIFF_FROM_MOTOR[p.dificultad] ?? 'medium',
            articleRef: full.evidencia?.cita ?? p.ref_legislativa ?? undefined,
        };
    }
}
