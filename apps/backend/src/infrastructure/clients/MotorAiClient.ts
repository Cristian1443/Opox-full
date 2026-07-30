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
} from '@opox/types';
import { logger } from '@opox/utils';

/**
 * Cliente HTTP para el "Motor de IA" del cliente (RAG + generación con
 * evidencia verbatim del temario). Documentación completa en el Postman
 * MotorIA_Ingesta_Tests.postman_collection.
 *
 * Estado actual (2026-07-25): el Motor NO está desplegado todavía; solo
 * lo tienen ellos en local. Este esqueleto queda listo para el día que
 * publiquen la URL. Cuando eso pase:
 *
 * 1. Rellenar MOTOR_API_BASE_URL y MOTOR_API_KEY en apps/backend/.env.
 * 2. En container.ts cambiar la construcción del cliente IA para
 *    componer MotorAiClient (questions/surgical) + AiApiClient (photo/hint).
 * 3. Los métodos analyzePhoto y generateHint aquí lanzan Error porque
 *    el Motor no los cubre — mantenlos en el cliente OpenAI directo.
 *
 * Ver packages/ai/MOTOR_INTEGRATION.md para el detalle del swap.
 */
export interface MotorAiConfig {
    baseUrl: string;      // ej. https://motor.opox.internal
    apiKey: string;       // X-API-Key del servicio (o key OpenAI sk-... en modo BYOK)
    timeoutMs: number;
    /** Segundos entre polls al endpoint /v1/jobs/{id}. Default 3s. */
    pollIntervalMs?: number;
    /** Timeout total del polling en ms. Default 120s. */
    pollTimeoutMs?: number;
}

export class MotorAiClient implements AiApiContract {
    private readonly http: AxiosInstance;
    // pollIntervalMs / pollTimeoutMs se leerán de config cuando implementemos
    // el polling real de /v1/jobs/{id}. Hoy el Motor no está desplegado.

    constructor(config: MotorAiConfig) {
        this.http = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeoutMs,
            headers: {
                // El Motor autentica por X-API-Key, NO por Authorization: Bearer.
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
    /**
     * Mapea nuestro contrato al del Motor:
     *   POST /v1/tests/generate  → { job_id }
     *   GET  /v1/jobs/{job_id}   → polling hasta done
     *   El resultado devuelve una sesion con preguntas; hay que llamar a
     *   GET /v1/tests/{sesion_id} para la vista pública (sin correcta_idx)
     *   O bien parsear el resultado.preguntas del job (que ya trae toda la info).
     *
     * NOTA: el Motor exige que el curso esté ingestado (POST /v1/courses con
     * un PDF de temario). Sin curso previo no puede generar. Cuando lo
     * activemos habrá que decidir el mapeo topicId → tema_ids del Motor.
     */
    async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
        // TODO(motor): implementar cuando el Motor esté desplegado.
        //   1. Resolver curso_id desde params.oposicion (tabla nueva training_courses
        //      con mapeo oposicion → curso_id del Motor).
        //   2. Resolver tema_ids desde params.topicId ("all" = null).
        //   3. POST /v1/tests/generate { curso_id, user_id, tema_ids, n_preguntas, dificultad }
        //      Nota: nuestras dificultades son easy/medium/hard, las del Motor facil/media/dificil.
        //   4. Poll GET /v1/jobs/{job_id} hasta estado=done.
        //   5. GET /v1/tests/{sesion_id} y mapear cada pregunta al shape GeneratedQuestion.
        //      El Motor no devuelve correctIndex en la vista pública — hay que llamar
        //      a POST /v1/tests/{sesion_id}/answer para cada opción, o pedir un endpoint
        //      privado al equipo IA que exponga la correcta al backend.
        //
        // Ver packages/ai/MOTOR_INTEGRATION.md para el detalle.
        logger.warn('[motor-ai] generateQuestions no implementado, Motor sin desplegar', { params });
        throw new Error('[MotorAiClient] generateQuestions no implementado. El Motor de IA aún no está hosteado — usa AiApiClient (OpenAI directo).');
    }

    // ─── generateSurgicalTest ─────────────────────────────────────────────────
    /**
     * El test quirúrgico se implementa con múltiples llamadas a
     * /v1/tests/generate filtrando por tema_ids con el reparto por failRate.
     * O idealmente pedimos al equipo IA un endpoint /v1/tests/surgical.
     */
    async generateSurgicalTest(params: GenerateSurgicalTestParams): Promise<SurgicalTestResult> {
        // TODO(motor): ver comentario de generateQuestions. Idéntica situación.
        logger.warn('[motor-ai] generateSurgicalTest no implementado, Motor sin desplegar', { patterns: params.errorPatterns.length });
        throw new Error('[MotorAiClient] generateSurgicalTest no implementado. El Motor de IA aún no está hosteado — usa AiApiClient (OpenAI directo).');
    }

    // ─── Métodos que el Motor NO cubre ────────────────────────────────────────
    // El Motor solo hace ingesta de PDFs + generación de tests con evidencia.
    // Foto-Test y pistas de sesión NO están en su alcance. Estos métodos
    // deben delegar en el cliente OpenAI directo (AiApiClient).

    async analyzePhoto(_params: AnalyzePhotoParams): Promise<PhotoTestResult> {
        throw new Error('[MotorAiClient] analyzePhoto NO forma parte del Motor de IA. Usa AiApiClient (OpenAI GPT-4o).');
    }

    async generateHint(_params: HintParams): Promise<HintResult> {
        throw new Error('[MotorAiClient] generateHint NO forma parte del Motor de IA. Usa AiApiClient (OpenAI GPT-4o-mini).');
    }

    // ── Bloque 9 · Factoría de Apuntes ───────────────────────────────────────
    // El Motor de IA del cliente no cubre estas tareas por diseño (su ingesta
    // está pensada para PDFs oficiales de temario, no para apuntes del usuario).
    // Delegar en AiApiClient (OpenAI) o en el pipeline propio del BRIEF_IA_BLOQUE9.

    async analyzeNoteDocument(_params: AnalyzeNoteDocumentParams): Promise<AnalyzeNoteDocumentResult> {
        throw new Error('[MotorAiClient] analyzeNoteDocument NO forma parte del Motor de IA. Usa AiApiClient (BRIEF_IA_BLOQUE9).');
    }

    async generateTagsFromNote(_params: GenerateTagsFromNoteParams): Promise<GenerateTagsFromNoteResult> {
        throw new Error('[MotorAiClient] generateTagsFromNote NO forma parte del Motor de IA. Usa AiApiClient (BRIEF_IA_BLOQUE9).');
    }

    async generateQuestionsFromNote(_params: GenerateQuestionsFromNoteParams): Promise<GenerateQuestionsFromNoteResult> {
        throw new Error('[MotorAiClient] generateQuestionsFromNote NO forma parte del Motor de IA. Usa AiApiClient (BRIEF_IA_BLOQUE9).');
    }
}
