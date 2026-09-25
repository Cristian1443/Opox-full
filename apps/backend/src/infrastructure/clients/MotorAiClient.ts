import axios, { type AxiosInstance } from 'axios';
import FormData from 'form-data';
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
    BankExamDTO,
    BankExamJobStatus,
    BankExamSource,
    StartBankMockRequest,
    StartBankMockResponse,
    BankMockResultDTO,
    TopicInventoryDTO,
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
    // Enum verificado contra /openapi.json (JobOut.estado). Los valores
    // 'pending'/'processing' que teníamos antes NUNCA los devuelve el Motor.
    estado: 'reserved' | 'queued' | 'running' | 'done' | 'error';
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

// Convierte el `topicId` que envía el mobile a `tema_ids` que espera el Motor.
// - 'all' o vacío → null (todo el temario)
// - CSV de hex → array
// El mobile ya envía los hex del Motor directamente (training_topics.topic_id
// es el hex, y GeneratorConfigScreen los concatena con coma). No necesitamos
// consultar Supabase para resolver semantic→hex.
export function parseTemaIds(topicId: string | null | undefined): string[] | null {
    if (!topicId || topicId === 'all') return null;
    const ids = topicId.split(',').map((s) => s.trim()).filter(Boolean);
    return ids.length > 0 ? ids : null;
}

/**
 * Cliente HTTP para el Motor de IA del cliente (RAG + generación con
 * evidencia verbatim del temario oficial). URL de producción:
 * https://ia.opox.jaeverba.com
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

    /**
     * Precarga el banco de preguntas de forma proactiva (fire-and-forget).
     * Se llama al arrancar el server desde `container.ts` para que la primera
     * llamada de streaming no pague el coste de cargar 336+ preguntas del
     * Motor (2 páginas × ~1 s = 2-4 s de latencia añadida en la primera
     * respuesta). Idempotente — `ensureQuestionBank` respeta el TTL.
     */
    async preloadQuestionBank(): Promise<void> {
        await this.ensureQuestionBank();
    }

    /**
     * Getter del cliente axios con auth ya configurada. Uso limitado a servicios
     * de infraestructura que necesiten golpear endpoints del Motor no cubiertos
     * por los métodos públicos (ej. CourseSyncService — /v1/courses catálogo).
     * Preferir métodos tipados cuando existan.
     */
    rawHttp(): AxiosInstance {
        return this.http;
    }

    /**
     * Ping liviano al Motor para evitar cold starts (2026-09-22 · diagnóstico
     * "el motor no responde" reportado desde España/Argentina). `GET /v1/courses`
     * no consume OpenAI ni genera contenido — solo mantiene el contenedor
     * despierto si el Motor corre en un plan de Render que se duerme por
     * inactividad. Nunca lanza; el caller (cron) solo necesita fire-and-forget.
     */
    async warmUp(): Promise<void> {
        try {
            await this.http.get('/v1/courses');
        } catch {
            // Silencioso — un warm-up fallido no debe alarmar ni cortar nada.
        }
    }

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
        const cursoId = params.cursoId ?? this.config.defaultCursoId;
        if (!cursoId) {
            throw new Error(
                '[MotorAiClient] curso_id no resuelto. ' +
                'Verifica training_courses en Supabase o MOTOR_DEFAULT_CURSO_ID en .env.',
            );
        }

        // 'all' → null (todo el temario). El mobile ya envía los tema_ids como
        // hex del Motor (training_topics.topic_id guarda el hex directamente,
        // y GeneratorConfigScreen los concatena con coma). Antes tirábamos esta
        // selección a la basura y siempre pedíamos "de todo el temario" al Motor
        // — el picker del mobile era cosmético (ver INFORME_GENERADOR_INFINITO.md
        // GAP-01).
        const temaIds: string[] | null = parseTemaIds(params.topicId);

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

        // INC-04: el job result no incluye correcta_idx inline para origen="generada".
        // El banco (/v1/courses/{id}/questions) SÍ tiene correcta_idx para esas preguntas —
        // sus IDs coinciden con los del job. El workaround de banco (líneas siguientes)
        // siempre funciona; no se hace fail-fast antes de intentarlo.

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

        // Fill from bank (2026-09-18, recomendación del equipo IA): si el
        // Motor entregó menos preguntas de las pedidas (por descartes internos
        // o pool minado), rellenamos aleatoriamente del banco cacheado. Mismo
        // patrón que en el flujo streaming (getSessionQuestions).
        const missing = Math.max(0, params.count - mapped.length);
        if (missing > 0 && mapped.length > 0) {
            const usedIds = new Set(mapped.map((q) => q.id));
            const topicsInResult = [...new Set(mapped.map((q) => q.topicId).filter(Boolean))];
            const filled = await this.fillFromBank(
                missing,
                topicsInResult.length > 0 ? topicsInResult : temaIds,
                usedIds,
            );
            mapped.push(...filled);
            if (filled.length > 0) {
                logger.info('[motor-ai] generateQuestions relleno desde banco', {
                    requested: params.count,
                    fromMotor: mapped.length - filled.length,
                    fromBank: filled.length,
                });
            }
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
        const count = params.count ?? 10;
        const totalFailRate =
            params.errorPatterns.reduce((s, p) => s + p.failRate, 0) || 1;

        const distribution = params.errorPatterns.map((p) => ({
            topicId: p.topicId,
            topic: p.topic,
            count: Math.round((p.failRate / totalFailRate) * count),
            percentage: Math.round((p.failRate / totalFailRate) * 100),
        }));

        // Temas reales con debilidades (excluye el placeholder 'all').
        const targeted = distribution.filter((d) => d.topicId !== 'all' && d.count > 0);

        if (targeted.length === 0) {
            // Sin patrones reales → banco completo como fallback.
            const questions = await this.generateQuestions({
                oposicion: params.oposicion,
                cursoId: params.cursoId,
                topicId: 'all',
                difficulty: 'medium',
                count,
            });
            return { questions, distribution };
        }

        // Llamadas paralelas por tema débil según la distribución proporcional.
        // Cada tema recibe al menos 2 preguntas para que su patrón tenga datos suficientes.
        const results = await Promise.allSettled(
            targeted.map((d) =>
                this.generateQuestions({
                    oposicion: params.oposicion,
                    cursoId: params.cursoId,
                    topicId: d.topicId,
                    difficulty: 'medium',
                    count: Math.max(3, d.count),
                }),
            ),
        );

        const allQuestions = results
            .filter(
                (r): r is PromiseFulfilledResult<GeneratedQuestion[]> =>
                    r.status === 'fulfilled',
            )
            .flatMap((r) => r.value);

        // Si el Motor no devolvió suficientes preguntas por temas individuales
        // (por ejemplo si algún topicId no existe en el banco) → fallback a 'all'.
        if (allQuestions.length < Math.ceil(count / 2)) {
            const questions = await this.generateQuestions({
                oposicion: params.oposicion,
                cursoId: params.cursoId,
                topicId: 'all',
                difficulty: 'medium',
                count,
            });
            return { questions, distribution };
        }

        // Cap al total pedido: cada llamada individual puede devolver más que
        // su cuota proporcional si el Motor ignora n_preguntas pequeños.
        return { questions: allQuestions.slice(0, count), distribution };
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

    // ─── Streaming API (Fase 2 · gaps-15-09-26) ───────────────────────────────
    // Los métodos anteriores (generateQuestions/generateSurgicalTest) esperan a
    // que el Motor termine antes de devolver preguntas. Estos exponen el pipeline
    // async del Motor (job_id + sesion_id + polling) para que el mobile pueda
    // mostrar la primera pregunta en cuanto está lista mientras el resto se genera.

    /**
     * Arranca un job en el Motor y devuelve el jobId, sesionId e initialPreguntas.
     * El Motor responde 202 con `GenerarTestRef: { job_id, sesion_id, preguntas[] }`
     * (OpenAPI verificado 2026-09-24). `sesion_id` es requerido en el schema;
     * `preguntas[]` son las initial_from_cache (default 3) para arranque instantáneo.
     */
    async startTestJob(input: {
        userId: string;
        cursoId: string;
        temaIds?: string[] | null;
        count: number;
        difficulty?: 'easy' | 'medium' | 'hard';
        bloqueIds?: string[] | null;
        contrarrelojSeg?: number;
        query?: string | null;
        fillFromCache?: boolean;
        initialFromCache?: number;
    }): Promise<{ jobId: string; sessionId: string | null; initialPreguntas: GeneratedQuestion[] }> {
        const body: Record<string, unknown> = {
            curso_id: input.cursoId,
            user_id: input.userId,
            tema_ids: input.temaIds ?? null,
            n_preguntas: input.count,
            dificultad: DIFF_TO_MOTOR[input.difficulty ?? 'medium'] ?? 'media',
        };
        if (input.bloqueIds?.length) body.bloque_ids = input.bloqueIds;
        if (typeof input.contrarrelojSeg === 'number') body.contrarreloj_seg = input.contrarrelojSeg;
        if (input.query) body.query = input.query;
        if (typeof input.fillFromCache === 'boolean') body.fill_from_cache = input.fillFromCache;
        if (typeof input.initialFromCache === 'number') body.initial_from_cache = input.initialFromCache;

        const t0 = Date.now();
        const res = await this.http.post<Record<string, unknown>>('/v1/tests/generate', body, {
            headers: { 'X-OpenAI-Key': this.config.openAiKey },
            validateStatus: (s) => s === 200 || s === 202,
        });
        const data = res.data;
        const rawPreguntas202 = Array.isArray(data.preguntas) ? (data.preguntas as MotorPreguntaJob[]) : [];
        logger.info('[motor-ai][stream] startTestJob', {
            status: res.status,
            jobId: data.job_id,
            sesionId: data.sesion_id,
            initialCount: rawPreguntas202.length,
            hasResultado: !!data.resultado,
            ms: Date.now() - t0,
            cursoId: input.cursoId,
            temas: input.temaIds?.length ?? 'null',
            n: input.count,
        });

        // 200 = respuesta desde caché ya con sesion_id. 202 = job en curso.
        // `recurso_id` en JobOut = cursoId (NO sessionId). El sessionId real
        // vive en `resultado.sesion_id` cuando el job termina.
        if (res.status === 200) {
            const resultado = data.resultado as { sesion_id?: string } | undefined;
            const progreso = data.progreso as { sesion_id?: string } | undefined;
            return {
                jobId: (data.job_id as string) ?? '',
                sessionId: progreso?.sesion_id ?? resultado?.sesion_id ?? null,
                initialPreguntas: [],
            };
        }

        // 202: GenerarTestRef = { job_id, sesion_id (required), preguntas[] }
        const sesionId = (data.sesion_id as string | undefined) ?? null;
        let initialPreguntas: GeneratedQuestion[] = [];
        if (rawPreguntas202.length > 0) {
            // Resolver correcta_idx desde banco (misma lógica que getSessionQuestions).
            await this.ensureQuestionBank();
            for (const p of rawPreguntas202) {
                const full: MotorPreguntaFull | undefined = typeof p.correcta_idx === 'number'
                    ? (p as unknown as MotorPreguntaFull)
                    : this.questionBankCache.get(p.id);
                if (full && typeof full.correcta_idx === 'number') {
                    initialPreguntas.push(this.mapPregunta(p, full));
                } else {
                    // Sin correcta_idx — marker -1; el runner resuelve via /answer.
                    initialPreguntas.push({
                        id: p.id,
                        text: p.enunciado,
                        options: p.opciones as [string, string, string, string],
                        correctIndex: -1 as unknown as 0 | 1 | 2 | 3,
                        explanation: p.explicacion ?? '',
                        topicId: p.tema_id,
                        topic: p.tema_id,
                        difficulty: (p.dificultad === 'facil' ? 'easy' : p.dificultad === 'dificil' ? 'hard' : 'medium'),
                    });
                }
            }
        }

        return { jobId: data.job_id as string, sessionId: sesionId, initialPreguntas };
    }

    /** Consulta el estado del job. Formato tolerante al schema real del Motor. */
    async getJobStatus(jobId: string): Promise<{
        status: string;
        sessionId: string | null;
        progress: { done: number; total: number };
    }> {
        const res = await this.http.get<Record<string, unknown>>(`/v1/jobs/${jobId}`);
        const raw = res.data;
        const estado = String(raw.estado ?? raw.status ?? 'pending');
        const resultado = (raw.resultado ?? {}) as Record<string, unknown>;
        const progresoRaw = (raw.progreso ?? raw.progress ?? {}) as Record<string, unknown>;
        const done = Number(progresoRaw.done ?? 0);
        const total = Number(progresoRaw.total ?? (resultado.preguntas as unknown[] | undefined)?.length ?? 0);
        // Fuente autoritativa del sesion_id: `progreso.sesion_id` (visible
        // desde 'running') o `resultado.sesion_id` (visible en 'done').
        // `JobOut.recurso_id` NO es el sessionId — apunta al curso del job
        // (mismo valor que curso_id), por lo que usarlo hace que
        // `GET /v1/tests/{cursoId}` devuelva 404 sesion_no_encontrada.
        const sessionId = (progresoRaw.sesion_id as string | undefined)
            ?? (resultado.sesion_id as string | undefined)
            ?? null;
        // Log de diagnóstico limitado a estados terminales (done/error) o si hay
        // sesionId nuevo — evita spamear el log con cada tick del polling.
        if (estado === 'done' || estado === 'error' || sessionId) {
            logger.info('[motor-ai][stream] getJobStatus', {
                jobId, estado, sessionId, done, total,
                mensaje: raw.mensaje,
                recursoId: raw.recurso_id,
                progresoSesionId: progresoRaw.sesion_id,
                resultadoSesionId: resultado.sesion_id,
                progresoKeys: Object.keys(progresoRaw),
                resultadoKeys: Object.keys(resultado),
            });
        }
        return {
            status: estado,
            sessionId,
            progress: { done, total },
        };
    }

    /** Devuelve las preguntas publicadas hasta el momento en la sesión. */
    async getSessionQuestions(sessionId: string, opts?: { requestedTemaIds?: string[]; jobDone?: boolean }): Promise<{
        questions: GeneratedQuestion[];
        deficit: number | null;
        /**
         * Metadata del `deficit` cuando el Motor NO puede entregar todas las
         * preguntas pedidas (G08 · INFORME_GENERADOR_INFINITO.md). El mobile
         * usa esto para avisar al usuario ("solo pudimos generar 3 de 10").
         * `reason: 'tope_minado'` = el Motor agotó los candidatos internos,
         * típicamente por selección de temas muy específica o historial largo.
         */
        deficitDetail: {
            requested: number;
            delivered: number;
            reason: string | null;
            motivos: Record<string, number>;
            generated: number | null;
            fromCache: number | null;
        } | null;
    }> {
        const res = await this.http.get<Record<string, unknown>>(`/v1/tests/${sessionId}`);
        const data = res.data;
        const preguntas = (data.preguntas as MotorPreguntaJob[] | undefined) ?? [];

        // Cargamos el banco por si alguna pregunta del stream sí está ahí
        // (raro: `/v1/tests/generate` produce IDs nuevos). Best-effort.
        if (preguntas.length > 0) await this.ensureQuestionBank();

        const mapped: GeneratedQuestion[] = [];
        let fromBank = 0;
        let deferred = 0;
        for (const p of preguntas) {
            const full: MotorPreguntaFull | undefined = typeof p.correcta_idx === 'number'
                ? (p as unknown as MotorPreguntaFull)
                : this.questionBankCache.get(p.id);
            if (full && typeof full.correcta_idx === 'number') {
                mapped.push(this.mapPregunta(p, full));
                fromBank++;
            } else {
                // La pregunta es nueva del Motor (no está en el banco) y el
                // SesionOut de /v1/tests/{id} no expone correcta_idx.
                // La incluimos con correctIndex: -1 → el mobile detecta el
                // marcador y resuelve la corrección por pregunta via
                // POST /v1/tests/{id}/answer (mismo patrón que bank_mock).
                mapped.push({
                    id: p.id,
                    text: p.enunciado,
                    options: p.opciones as [string, string, string, string],
                    correctIndex: -1 as unknown as 0 | 1 | 2 | 3,
                    explanation: p.explicacion ?? '',
                    topicId: (p as unknown as { tema_id?: string }).tema_id ?? '',
                    topic: (p as unknown as { tema_titulo?: string }).tema_titulo ?? '',
                    difficulty: (p.dificultad === 'facil' ? 'easy'
                        : p.dificultad === 'dificil' ? 'hard' : 'medium'),
                });
                deferred++;
            }
        }
        // El deficit real del Motor: qué preguntas se pidieron / publicaron / descarte.
        // Schema `DeficitOut` verificado en /openapi.json (2026-09-24):
        // { pedidas, publicadas, motivos_descarte, generated?, from_cache?, corte? }
        const deficitRaw = data.deficit as
            | { pedidas?: number; publicadas?: number; motivos_descarte?: Record<string, number>; corte?: string; generated?: number; from_cache?: number }
            | number | null | undefined;
        const deficitCount = typeof deficitRaw === 'number'
            ? deficitRaw
            : (deficitRaw?.pedidas != null && deficitRaw?.publicadas != null
                ? deficitRaw.pedidas - deficitRaw.publicadas
                : null);

        // Fill from bank: cuando el Motor entrega menos de lo pedido, completamos
        // desde el banco cacheado (/v1/courses/{id}/questions).
        //
        // CONDICIÓN DOBLE para evitar inflar el test con preguntas de banco en
        // llamadas intermedias (progress.done >= 1 pero job no terminado):
        //   1. opts.jobDone === true  — el mobile solo lo manda en la llamada final.
        //   2. deficit.pedidas presente — el Motor declara explícitamente el shortfall.
        // Sin (1) el Motor podría declarar deficit mid-stream → fill → luego más
        // preguntas del Motor como "fresh" → total > pedidas (bug: 18 en vez de 10).
        //
        // Fix topic filter (2026-09-20): opts.requestedTemaIds (selección original
        // del usuario) en vez de topicsInResult, que puede ser más estrecho cuando
        // el Motor concentró todo en 1 de los N temas seleccionados.
        const requestedCount = typeof deficitRaw === 'object' && deficitRaw?.pedidas != null
            ? deficitRaw.pedidas
            : mapped.length;
        const missing = Math.max(0, requestedCount - mapped.length);
        let filledCount = 0;
        if (missing > 0 && opts?.jobDone) {
            const usedIds = new Set(mapped.map((q) => q.id));
            const topicsInResult = [...new Set(mapped.map((q) => q.topicId).filter(Boolean))];
            const temaIdsForFill = opts?.requestedTemaIds?.length
                ? opts.requestedTemaIds
                : (topicsInResult.length > 0 ? topicsInResult : null);
            const filled = await this.fillFromBank(
                missing,
                temaIdsForFill,
                usedIds,
            );
            mapped.push(...filled);
            filledCount = filled.length;
        }

        // Estructurado para el mobile (G08). Solo devolvemos deficitDetail
        // cuando, TRAS el fill from bank, sigue faltando ≥1 pregunta.
        // Si el fill rellenó todo, el usuario no ve modal — todo transparente.
        // El Motor siempre incluye deficit.pedidas cuando entrega menos de lo
        // pedido (campo DeficitOut requerido en su schema /openapi.json).
        let deficitDetail: {
            requested: number;
            delivered: number;
            reason: string | null;
            motivos: Record<string, number>;
            generated: number | null;
            fromCache: number | null;
        } | null = null;
        const finalDelivered = mapped.length;
        if (
            typeof deficitRaw === 'object'
            && deficitRaw !== null
            && typeof deficitRaw.pedidas === 'number'
            && finalDelivered < deficitRaw.pedidas
        ) {
            deficitDetail = {
                requested: deficitRaw.pedidas,
                delivered: finalDelivered,
                reason: deficitRaw.corte ?? null,
                motivos: deficitRaw.motivos_descarte ?? {},
                generated: deficitRaw.generated ?? null,
                fromCache: deficitRaw.from_cache ?? null,
            };
        }

        logger.info('[motor-ai][stream] getSessionQuestions', {
            sessionId,
            jobDone: opts?.jobDone ?? false,
            preguntasMotor: preguntas.length,
            mapped: mapped.length,
            fromBank,
            deferred,
            filledFromBank: filledCount,
            bankSize: this.questionBankCache.size,
            deficit: deficitRaw,
            deficitDetail,
        });
        return {
            questions: mapped,
            deficit: deficitCount,
            deficitDetail,
        };
    }

    /**
     * Arma un test SOLO desde preguntas ya generadas y cacheadas en SQL del
     * Motor (sin llamar al LLM). Retorno síncrono ~3 s para 10 preguntas
     * vs ~25 s de la primera pregunta del generador live.
     *
     * Endpoint: POST /v1/tests/from-cache (schema ArmarDesdeCacheIn/SesionOut).
     *
     * Cache miss NO devuelve 404 — el Motor responde 200 con
     * `deficit.publicadas < deficit.pedidas` (o array vacío + deficit).
     * Devolvemos `pedidas`/`publicadas` para que el use case decida si el
     * cliente arranca sync, mixto (cache seed + job para el resto) o cae
     * directo al generador.
     *
     * Las preguntas del cache llegan sin `correcta_idx` (PreguntaOut del
     * Motor). Aplicamos el workaround INC-04 vía banco cacheado — las
     * cacheadas son casi por definición del banco.
     */
    async generateFromCache(input: {
        userId: string;
        cursoId: string;
        temaIds?: string[] | null;
        count: number;
        difficulty?: 'easy' | 'medium' | 'hard';
        bloqueIds?: string[] | null;
        query?: string | null;
    }): Promise<{
        questions: GeneratedQuestion[];
        sessionId: string | null;
        pedidas: number;
        publicadas: number;
    }> {
        const body: Record<string, unknown> = {
            curso_id: input.cursoId,
            user_id: input.userId,
            tema_ids: input.temaIds ?? null,
            n_preguntas: input.count,
            dificultad: DIFF_TO_MOTOR[input.difficulty ?? 'medium'] ?? 'media',
        };
        if (input.bloqueIds?.length) body.bloque_ids = input.bloqueIds;
        if (input.query) body.query = input.query;
        const t0 = Date.now();
        // Timeout interno 6 s (Cristian midió 3 s para 10 preguntas — 2× margen).
        // Si el Motor tarda más, tratamos como miss para no bloquear al usuario.
        const res = await this.http.post<Record<string, unknown>>(
            '/v1/tests/from-cache',
            body,
            {
                headers: { 'X-OpenAI-Key': this.config.openAiKey },
                timeout: 6000,
                // El Motor solo devuelve 200 (con deficit si aplica) o 422 de validación.
                validateStatus: (s) => s === 200,
            },
        );

        const data = res.data;
        const preguntas = (data.preguntas as MotorPreguntaJob[] | undefined) ?? [];
        const sessionId = (data.sesion_id as string | undefined) ?? null;
        const deficitRaw = data.deficit as
            | { pedidas?: number; publicadas?: number }
            | null
            | undefined;
        const pedidas = deficitRaw?.pedidas ?? input.count;
        const publicadas = deficitRaw?.publicadas ?? preguntas.length;

        // Resolver correcta_idx desde el banco (workaround INC-04).
        if (preguntas.length > 0) await this.ensureQuestionBank();

        const mapped: GeneratedQuestion[] = [];
        let dropped = 0;
        let topicIdsPopulated = 0;
        let topicIdsEmpty = 0;
        for (const p of preguntas) {
            const full = typeof p.correcta_idx === 'number'
                ? (p as unknown as MotorPreguntaFull)
                : this.questionBankCache.get(p.id);
            if (full && typeof full.correcta_idx === 'number') {
                mapped.push(this.mapPregunta(p, full));
                // Diagnóstico: ¿el cache puebla tema_id? Si sí, la granularidad
                // del Laboratorio (agrupación por topic_id) mejora vs el flujo
                // streaming puro, donde el Motor deja tema_id: '' casi siempre.
                if (typeof p.tema_id === 'string' && p.tema_id.length > 0) topicIdsPopulated++;
                else topicIdsEmpty++;
            } else {
                // Pregunta cacheada NO resoluble (ni con correcta_idx inline ni
                // presente en el banco). La DESCARTAMOS en vez de pushearla con
                // correctIndex: -1 — el runner intentaría corregirla contra el
                // sessionId del JOB (cuando el use case B arranca uno para el
                // remaining) y el Motor devolvería 404 pregunta_no_encontrada
                // porque esa pregunta pertenece a la sesión del cache, no del
                // job. El use case GetCachedTestUseCase ve `publicadas` reducido
                // y pide más preguntas al job para compensar.
                dropped++;
            }
        }

        // `publicadas` real: cuántas preguntas del cache llegan RESUELTAS al
        // caller. Si el Motor devolvió 3 pero descartamos 1, publicadas=2 →
        // el use case pedirá 8 al job en vez de 7. Sin este ajuste el runner
        // vería menos preguntas de las anunciadas y arrancaría un test corto.
        const publicadasReal = mapped.length;

        logger.info('[motor-ai][cache] generateFromCache', {
            cursoId: input.cursoId,
            temas: input.temaIds?.length ?? 'null',
            pedidas,
            publicadasMotor: publicadas,
            publicadasReal,
            dropped,
            topicIdsPopulated,
            topicIdsEmpty,
            sessionId,
            ms: Date.now() - t0,
        });

        return { questions: mapped, sessionId, pedidas, publicadas: publicadasReal };
    }

    /** Envía la respuesta del usuario a la sesión activa (background). */
    async postSessionAnswer(input: {
        sessionId: string;
        questionId: string;
        optionIndex: number;
        userId: string;
    }): Promise<{
        correct: boolean;
        correctIndex: number | null;
        explanation: string | null;
        justifications: string[];
        evidence?: { cita?: string; pagina?: number };
    }> {
        // El Motor exige `elegida_idx` (no `opcion_idx`) — verificado tanto en
        // la Postman collection (petición 7 · "Responder una pregunta del
        // simulacro") como en la respuesta 422 `missing elegida_idx`.
        const res = await this.http.post<Record<string, unknown>>(
            `/v1/tests/${input.sessionId}/answer`,
            {
                user_id: input.userId,
                pregunta_id: input.questionId,
                elegida_idx: input.optionIndex,
            },
            { headers: { 'X-OpenAI-Key': this.config.openAiKey } },
        );
        // Schema `ResponderOut` del Motor (verificado en /openapi.json 2026-09-17):
        // { correcta, correcta_idx, explicacion?, justificaciones?, evidencia? }.
        // Nombres en snake_case. Antes se leía `correctaIdx` (camelCase) y
        // devolvía null — el mini-test BOE también estaba afectado por este bug.
        const data = res.data;
        const evidenciaRaw = data.evidencia as { cita?: string; pagina?: number } | null | undefined;
        return {
            correct: Boolean(data.correcta),
            correctIndex: typeof data.correcta_idx === 'number' ? (data.correcta_idx as number) : null,
            explanation: (data.explicacion as string | null) ?? null,
            justifications: Array.isArray(data.justificaciones) ? (data.justificaciones as string[]) : [],
            evidence: evidenciaRaw ?? undefined,
        };
    }

    // ─── Banco de exámenes oficiales (Bloque 6.6) ─────────────────────────────
    // Endpoints /v1/bank/exams y /v1/bank/mock-exams. El upload es multipart
    // (form-data). El mock-exam devuelve preguntas Motor sin correcta_idx —
    // la corrección se resuelve pregunta a pregunta con postSessionAnswer
    // (mismo patrón que el mini-test BOE).

    /**
     * GET /v1/bank/exams?course_id=&limit=&offset= — lista bruta del banco del curso.
     * Devuelve la forma "cruda" (sin historial de usuario). El enriquecimiento
     * con bestScore/completedAt/attemptCount vive en ListBankExamsUseCase.
     */
    async listBankExams(cursoId: string, limit = 100, offset = 0): Promise<Array<Omit<BankExamDTO, 'status' | 'bestScore' | 'completedAt' | 'attemptCount'>>> {
        const res = await this.http.get<unknown[]>(
            `/v1/bank/exams?course_id=${encodeURIComponent(cursoId)}&limit=${limit}&offset=${offset}`,
        );
        const list = Array.isArray(res.data) ? res.data : [];
        return list.map((raw) => {
            const e = raw as Record<string, unknown>;
            const fuenteRaw = String(e.fuente ?? 'otro');
            const fuente: BankExamSource =
                fuenteRaw === 'oficial' || fuenteRaw === 'profesor' ? (fuenteRaw as BankExamSource) : 'otro';
            return {
                id: String(e.id ?? ''),
                cursoId: String(e.curso_id ?? cursoId),
                titulo: String(e.titulo ?? ''),
                anio: Number(e.anio ?? 0),
                fuente,
                nPreguntas: Number(e.n_preguntas ?? 0),
            };
        });
    }

    /**
     * Inventario de temas del Motor (v1.6.0 · GET /v1/courses/{curso_id}/topics-inventory).
     * Con `userId` descuenta las preguntas que ese usuario ya contestó. Usado solo
     * para informar al picker de temas — nunca bloquea ni cambia el flujo de generación.
     */
    async getTopicsInventory(cursoId: string, userId?: string): Promise<TopicInventoryDTO[]> {
        const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
        const res = await this.http.get<unknown[]>(
            `/v1/courses/${encodeURIComponent(cursoId)}/topics-inventory${qs}`,
        );
        const list = Array.isArray(res.data) ? res.data : [];
        return list.map((raw) => {
            const e = raw as Record<string, unknown>;
            return {
                topicId: String(e.topic_id ?? ''),
                title: String(e.title ?? ''),
                blockId: e.block_id != null ? String(e.block_id) : null,
                pages: Number(e.pages ?? 0),
                chunks: Number(e.chunks ?? 0),
                questionsAvailable: Number(e.questions_available ?? 0),
                byDifficulty: (e.by_difficulty as Record<string, number> | undefined) ?? {},
                estimatedCapacity: Number(e.estimated_capacity ?? 0),
                healthyPool: Boolean(e.healthy_pool),
            };
        });
    }

    /**
     * POST /v1/bank/exams (multipart) — incorpora un examen (PDF/DOCX) al banco.
     * Devuelve 202 + job_id; la extracción es asíncrona. Requiere X-OpenAI-Key (BYOK).
     */
    async uploadBankExam(input: {
        cursoId: string;
        titulo: string;
        anio: number;
        fuente: BankExamSource;
        fileBuffer: Buffer;
        mimeType: string;
        fileName: string;
    }): Promise<{ jobId: string }> {
        const form = new FormData();
        form.append('file', input.fileBuffer, {
            filename: input.fileName,
            contentType: input.mimeType,
        });
        form.append('course_id', input.cursoId);
        form.append('titulo', input.titulo);
        form.append('anio', String(input.anio));
        form.append('fuente', input.fuente);

        const res = await this.http.post<Record<string, unknown>>('/v1/bank/exams', form, {
            headers: {
                ...form.getHeaders(),
                'X-OpenAI-Key': this.config.openAiKey,
            },
            // El Motor devuelve 202 al aceptar el job.
            validateStatus: (s) => s === 200 || s === 202,
            // El archivo puede ser grande — subir tiene su propio timeout largo.
            timeout: 60_000,
            maxBodyLength: 25 * 1024 * 1024,
            maxContentLength: 25 * 1024 * 1024,
        });

        const jobId = String(res.data.job_id ?? '');
        if (!jobId) {
            throw new Error('[MotorAiClient] uploadBankExam: el Motor no devolvió job_id');
        }
        return { jobId };
    }

    /**
     * GET /v1/jobs/{jobId} — sigue el trabajo de incorporación de un examen.
     * Schema `JobOut` (verificado en /openapi.json 2026-09-17):
     * { id, tipo, recurso_id, estado, mensaje, progreso, resultado,
     *   tokens_in, tokens_out, embedding_tokens, cost_usd }.
     * `estado` es enum: reserved | queued | running | done | error.
     */
    async getBankExamJob(jobId: string): Promise<BankExamJobStatus> {
        const res = await this.http.get<Record<string, unknown>>(`/v1/jobs/${jobId}`);
        const raw = res.data;
        const estado = String(raw.estado ?? 'queued');
        const validStates = ['reserved', 'queued', 'running', 'done', 'error'] as const;
        const status = (validStates.includes(estado as (typeof validStates)[number])
            ? estado
            : 'queued') as BankExamJobStatus['status'];

        const resultado = (raw.resultado ?? {}) as Record<string, unknown>;
        return {
            status,
            message: raw.mensaje ? String(raw.mensaje) : undefined,
            costUsd: typeof raw.cost_usd === 'number' ? (raw.cost_usd as number) : undefined,
            error: raw.error ? String(raw.error) : undefined,
            result: Object.keys(resultado).length > 0
                ? {
                    examenId: resultado.examen_id ? String(resultado.examen_id) : undefined,
                    extraidas: typeof resultado.extraidas === 'number' ? resultado.extraidas : undefined,
                    guardadas: typeof resultado.guardadas === 'number' ? resultado.guardadas : undefined,
                    duplicadas: typeof resultado.duplicadas === 'number' ? resultado.duplicadas : undefined,
                    descartadas: typeof resultado.descartadas === 'number' ? resultado.descartadas : undefined,
                    sinTema: typeof resultado.sin_tema === 'number' ? resultado.sin_tema : undefined,
                    yaIncorporado: typeof resultado.ya_incorporado === 'boolean' ? resultado.ya_incorporado : undefined,
                    corte: resultado.corte ? String(resultado.corte) : undefined,
                }
                : undefined,
        };
    }

    /**
     * POST /v1/bank/mock-exams — compone un simulacro y abre la sesión.
     * Excluye lo ya respondido por ese userId. Devuelve preguntas SIN correcta_idx —
     * corrige por endpoint (postSessionAnswer). NO envía X-OpenAI-Key (no consume LLM).
     */
    async startBankMock(input: StartBankMockRequest & { cursoId: string; userId: string }): Promise<StartBankMockResponse> {
        const body: Record<string, unknown> = {
            curso_id: input.cursoId,
            user_id: input.userId,
        };
        if (input.distribucion && Object.keys(input.distribucion).length > 0) {
            body.distribucion = input.distribucion;
        } else if (typeof input.nPreguntas === 'number') {
            body.n_preguntas = input.nPreguntas;
        }
        if (typeof input.soloOficiales === 'boolean') body.solo_oficiales = input.soloOficiales;
        if (typeof input.contrarrelojSeg === 'number') body.contrarreloj_seg = input.contrarrelojSeg;
        // El Motor acepta `exam_id` (inglés) — verificado en su /openapi.json
        // el 2026-09-17. La Postman collection está desactualizada y NO lo
        // lista, pero el schema real `SimulacroIn` sí lo incluye como campo
        // opcional (string, minLength 1). Cuando viene, el simulacro se
        // compone con las preguntas de ESE examen concreto.
        if (input.examId) body.exam_id = input.examId;

        const res = await this.http.post<Record<string, unknown>>('/v1/bank/mock-exams', body);
        const data = res.data;
        const preguntasRaw = (data.preguntas as MotorPreguntaJob[] | undefined) ?? [];

        // Motor devuelve preguntas sin correcta_idx (vista pública). El adaptador
        // acepta undefined y el runner mostrará la corrección tras /answer.
        const questions: GeneratedQuestion[] = preguntasRaw.map((p) => ({
            id: p.id,
            text: p.enunciado,
            options: p.opciones as [string, string, string, string],
            correctIndex: undefined as unknown as 0 | 1 | 2 | 3,
            explanation: '',
            topicId: p.tema_id,
            topic: p.tema_id,
            difficulty: DIFF_FROM_MOTOR[p.dificultad] ?? 'medium',
            articleRef: p.ref_legislativa ?? undefined,
        }));

        // `contrarreloj_seg` en la respuesta refleja lo que EL MOTOR aplicó
        // (puede diferir del solicitado si el servidor lo capó). Preferimos
        // ese valor; si no viene, caemos al input como best-effort.
        const contrarrelojFromMotor = typeof data.contrarreloj_seg === 'number'
            ? (data.contrarreloj_seg as number)
            : (typeof input.contrarrelojSeg === 'number' ? input.contrarrelojSeg : 0);
        const deficitRaw = data.deficit as Record<string, unknown> | null | undefined;
        return {
            sesionId: String(data.sesion_id ?? ''),
            questions,
            contrarrelojSeg: contrarrelojFromMotor,
            deficit: deficitRaw
                ? {
                    pedidas: Number(deficitRaw.pedidas ?? 0),
                    publicadas: Number(deficitRaw.publicadas ?? 0),
                    motivosDescarte: (deficitRaw.motivos_descarte as Record<string, number> | undefined),
                }
                : undefined,
        };
    }

    /**
     * GET /v1/tests/{sesionId}/result — resultado agregado del simulacro.
     * Schema `ResultadoSesionOut` (verificado en /openapi.json 2026-09-17):
     * { sesion_id, respondidas, total, aciertos, nota_pct, tiempo_total_ms, por_tema }.
     * NO trae detalle pregunta-a-pregunta; esa info ya se obtuvo en vivo
     * respondiendo cada pregunta contra /v1/tests/{id}/answer.
     */
    async getBankMockResult(sesionId: string): Promise<BankMockResultDTO> {
        const res = await this.http.get<Record<string, unknown>>(`/v1/tests/${sesionId}/result`);
        const data = res.data;
        const porTemaRaw = (data.por_tema as Record<string, unknown>[] | undefined) ?? [];
        return {
            sesionId: String(data.sesion_id ?? sesionId),
            respondidas: Number(data.respondidas ?? 0),
            total: Number(data.total ?? 0),
            aciertos: Number(data.aciertos ?? 0),
            notaPct: Number(data.nota_pct ?? 0),
            tiempoTotalMs: Number(data.tiempo_total_ms ?? 0),
            porTema: porTemaRaw.map((t) => ({
                temaId: String(t.tema_id ?? ''),
                temaTitulo: t.tema_titulo ? String(t.tema_titulo) : '',
                aciertos: Number(t.aciertos ?? 0),
                fallos: Number(t.fallos ?? 0),
            })),
        };
    }

    /**
     * DELETE /v1/users/{user_id} — purga todos los datos del usuario del Motor
     * (historial de sesiones, perfil de tono, preguntas respondidas).
     * RGPD: fire-and-forget desde DeleteAccountUseCase. Silencia 404
     * (usuario sin datos en el Motor — puede que nunca haya hecho un test).
     */
    async deleteUserData(userId: string): Promise<void> {
        try {
            await this.http.delete(`/v1/users/${encodeURIComponent(userId)}`);
            logger.info('[motor-ai] deleteUserData ok', { userId });
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } }).response?.status;
            if (status === 404) return;
            logger.warn('[motor-ai] deleteUserData: error ignorado (RGPD no crítico)', {
                userId,
                status,
                err: err instanceof Error ? err.message : String(err),
            });
        }
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

    /**
     * Rellena hasta `needed` preguntas cogiendo aleatoriamente del banco
     * cacheado (`/v1/courses/{id}/questions`). Diseñado para completar el
     * `deficit` cuando el Motor no puede entregar todas las preguntas
     * pedidas — el equipo IA lo recomendó explícitamente cuando reportamos
     * "descartes agresivos por hecho_ya_preguntado" (2026-09-18).
     *
     * - `temaIds` (opcional): filtra por temas concretos. Null/vacío = todo el banco.
     * - `excludeIds`: excluye preguntas ya presentes en el resultado del job.
     * - Fisher-Yates shuffle → aleatorio real, no `sort()` con random.
     *
     * Devuelve `GeneratedQuestion[]` ya mapeadas con `correctIndex` real
     * (el banco siempre trae `correcta_idx`, resolviendo también INC-04).
     */
    private async fillFromBank(
        needed: number,
        temaIds: string[] | null,
        excludeIds: Set<string>,
    ): Promise<GeneratedQuestion[]> {
        if (needed <= 0) return [];
        await this.ensureQuestionBank();
        if (this.questionBankCache.size === 0) return [];

        const wantedTopics = temaIds && temaIds.length > 0 ? new Set(temaIds) : null;
        const candidates: MotorPreguntaFull[] = [];
        for (const p of this.questionBankCache.values()) {
            if (excludeIds.has(p.id)) continue;
            if (wantedTopics && !wantedTopics.has(p.tema_id)) continue;
            if (typeof p.correcta_idx !== 'number') continue;
            candidates.push(p);
        }

        // Fisher-Yates parcial: solo permutamos los primeros `needed` para no
        // recorrer el array entero cuando el banco es grande.
        const take = Math.min(needed, candidates.length);
        for (let i = 0; i < take; i++) {
            const j = i + Math.floor(Math.random() * (candidates.length - i));
            const tmp = candidates[i]!;
            candidates[i] = candidates[j]!;
            candidates[j] = tmp;
        }
        const picked = candidates.slice(0, take);

        logger.info('[motor-ai] fillFromBank', {
            needed,
            available: candidates.length,
            picked: picked.length,
            wantedTopics: wantedTopics ? [...wantedTopics] : null,
            excluded: excludeIds.size,
        });

        return picked.map((full) => this.mapPregunta(full, full));
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
