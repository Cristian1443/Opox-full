import { randomUUID } from 'crypto';
import axios, { type AxiosInstance } from 'axios';
import { z } from 'zod';
import type {
    AiApiConfig,
    AiApiContract,
    GenerateQuestionsParams,
    GeneratedQuestion,
    AnalyzePhotoParams,
    PhotoTestResult,
    GenerateSurgicalTestParams,
    SurgicalTestResult,
    HintParams,
    HintResult,
} from '@opox/types';
import { logger } from '@opox/utils';

/**
 * Cliente OpenAI para el contrato de IA de OPOX (Bloques 6 y 7).
 *
 * Un solo cliente HTTP contra `https://api.openai.com/v1/chat/completions`
 * con `response_format: json_object` para respuestas estructuradas.
 *
 * Modelos:
 *   - generateQuestions / generateSurgicalTest / generateHint → AI_API_DEFAULT_MODEL
 *     (recomendado: gpt-4o-mini por coste)
 *   - analyzePhoto → siempre gpt-4o (necesita visión, mini no la tiene)
 *
 * El día que el Motor de IA del cliente esté desplegado, ver
 * packages/ai/MOTOR_INTEGRATION.md para cambiar a él sin tocar el resto
 * del backend (solo env vars + swap en container.ts).
 */
export class AiApiClient implements AiApiContract {
    private readonly http: AxiosInstance;
    /** Modelo por defecto para operaciones textuales */
    private readonly textModel: string;
    /** Modelo de visión — fijo, gpt-4o-mini no soporta imágenes. */
    private static readonly VISION_MODEL = 'gpt-4o';

    constructor(config: AiApiConfig) {
        this.textModel = config.defaultModel;
        this.http = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeoutMs,
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        this.http.interceptors.response.use(
            (res) => res,
            (err) => {
                logger.warn('[ai-openai] error', {
                    url: err.config?.url,
                    status: err.response?.status,
                    // OpenAI devuelve el motivo en err.response.data.error.message
                    detail: err.response?.data?.error?.message ?? err.message,
                });
                return Promise.reject(err);
            },
        );
    }

    // ─── generateQuestions ────────────────────────────────────────────────────
    async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
        logger.info('[ai-openai] generateQuestions', { count: params.count, difficulty: params.difficulty, topicId: params.topicId });

        const systemPrompt = QUESTIONS_SYSTEM_PROMPT;
        const userPrompt = renderQuestionsUserPrompt(params);

        const raw = await this.chatJson({
            model: this.textModel,
            system: systemPrompt,
            user: userPrompt,
            maxTokens: 4096,
        });

        // Aceptamos { questions: [...] } o directamente [...] (los modelos varían).
        const parsed = questionsResponseSchema.safeParse(raw);
        if (!parsed.success) {
            throw new Error(`[AiApiClient] generateQuestions: respuesta OpenAI malformada — ${parsed.error.message}`);
        }
        const arr = Array.isArray(parsed.data) ? parsed.data : parsed.data.questions;

        return arr.map((q) => normalizeQuestion(q, params.topicId, params.difficulty));
    }

    // ─── analyzePhoto ─────────────────────────────────────────────────────────
    async analyzePhoto(params: AnalyzePhotoParams): Promise<PhotoTestResult> {
        logger.info('[ai-openai] analyzePhoto', { oposicion: params.oposicion, mimeType: params.mimeType });

        const systemPrompt = PHOTO_SYSTEM_PROMPT;
        const userText = renderPhotoUserPrompt(params.oposicion);
        const dataUrl = `data:${params.mimeType};base64,${params.imageBase64}`;

        const raw = await this.chatJson({
            model: AiApiClient.VISION_MODEL,
            system: systemPrompt,
            userContent: [
                { type: 'text', text: userText },
                { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
            ],
            maxTokens: 700,
        });

        const parsed = photoResponseSchema.safeParse(raw);
        if (!parsed.success) {
            // Caso especial declarado en el brief: imagen ilegible.
            if (typeof raw?.error === 'string' && raw.error === 'IMAGE_NOT_READABLE') {
                throw new Error('IMAGE_NOT_READABLE');
            }
            throw new Error(`[AiApiClient] analyzePhoto: respuesta OpenAI malformada — ${parsed.error.message}`);
        }

        return parsed.data;
    }

    // ─── generateSurgicalTest ─────────────────────────────────────────────────
    async generateSurgicalTest(params: GenerateSurgicalTestParams): Promise<SurgicalTestResult> {
        logger.info('[ai-openai] generateSurgicalTest', { patterns: params.errorPatterns.length, count: params.count });

        // La distribución la calculamos nosotros: es matemática determinista y
        // así garantizamos que sum(count) === params.count sin depender del LLM.
        const distribution = computeSurgicalDistribution(params);

        // Pedimos al LLM sólo las preguntas, indicando exactamente cuántas por tema.
        const systemPrompt = SURGICAL_SYSTEM_PROMPT;
        const userPrompt = renderSurgicalUserPrompt(params.oposicion, distribution);

        const raw = await this.chatJson({
            model: this.textModel,
            system: systemPrompt,
            user: userPrompt,
            maxTokens: 4096,
        });

        const parsed = questionsResponseSchema.safeParse(raw);
        if (!parsed.success) {
            throw new Error(`[AiApiClient] generateSurgicalTest: respuesta OpenAI malformada — ${parsed.error.message}`);
        }
        const arr = Array.isArray(parsed.data) ? parsed.data : parsed.data.questions;

        // Reasignamos topicId/topic desde la distribución por si el modelo se salió.
        // Todas las preguntas del test quirúrgico van con dificultad 'hard' (brief).
        const questions: GeneratedQuestion[] = [];
        let cursor = 0;
        for (const slot of distribution) {
            for (let i = 0; i < slot.count && cursor < arr.length; i++, cursor++) {
                const q = arr[cursor]!;
                questions.push(normalizeQuestion({ ...q, topicId: slot.topicId, topic: slot.topic }, slot.topicId, 'hard'));
            }
        }

        return { questions, distribution };
    }

    // ─── generateHint ─────────────────────────────────────────────────────────
    async generateHint(params: HintParams): Promise<HintResult> {
        logger.info('[ai-openai] generateHint', { topicId: params.topicId });

        const systemPrompt = HINT_SYSTEM_PROMPT;
        const userPrompt = renderHintUserPrompt(params);

        const raw = await this.chatJson({
            model: this.textModel,
            system: systemPrompt,
            user: userPrompt,
            maxTokens: 300,
        });

        const parsed = hintResponseSchema.safeParse(raw);
        if (!parsed.success) {
            throw new Error(`[AiApiClient] generateHint: respuesta OpenAI malformada — ${parsed.error.message}`);
        }

        // Cap defensivo por si el modelo se pasa del límite del brief.
        const hint = parsed.data.hint.length > 300 ? parsed.data.hint.slice(0, 297) + '...' : parsed.data.hint;
        return { hint, articleRef: parsed.data.articleRef };
    }

    // ─── HTTP privado ─────────────────────────────────────────────────────────
    /**
     * Llamada a OpenAI Chat Completions con response_format json_object.
     * Reintenta 1 vez si la primera respuesta no es JSON parseable.
     */
    private async chatJson(opts: ChatOpts): Promise<any> {
        const body = buildChatBody(opts);

        for (let attempt = 1; attempt <= 2; attempt++) {
            const { data } = await this.http.post('/chat/completions', body);
            const usage = data.usage;
            if (usage) {
                logger.info('[ai-openai] tokens', {
                    model: opts.model,
                    prompt: usage.prompt_tokens,
                    completion: usage.completion_tokens,
                    total: usage.total_tokens,
                });
            }
            const content = data.choices?.[0]?.message?.content;
            if (!content) {
                if (attempt === 2) throw new Error('[AiApiClient] OpenAI devolvió respuesta sin contenido');
                continue;
            }
            try {
                return JSON.parse(content);
            } catch {
                if (attempt === 2) throw new Error('[AiApiClient] OpenAI devolvió JSON inválido tras 2 intentos');
                logger.warn('[ai-openai] JSON parse falló, reintentando 1x');
            }
        }
        throw new Error('[AiApiClient] chatJson: nunca debería llegar aquí');
    }
}

// ─── Chat body helper ─────────────────────────────────────────────────────────

interface ChatOpts {
    model: string;
    system: string;
    user?: string;
    userContent?: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } }>;
    maxTokens: number;
}

function buildChatBody(opts: ChatOpts): Record<string, unknown> {
    const userMessage = opts.userContent
        ? { role: 'user', content: opts.userContent }
        : { role: 'user', content: opts.user ?? '' };

    return {
        model: opts.model,
        messages: [
            { role: 'system', content: opts.system },
            userMessage,
        ],
        max_tokens: opts.maxTokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
    };
}

// ─── Schemas de validación (zod) ──────────────────────────────────────────────

const generatedQuestionSchema = z.object({
    id: z.string().optional(), // el backend lo asigna si falta
    text: z.string().min(1),
    options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().min(1),
    topicId: z.string().optional(),
    topic: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    difficultyScore: z.number().int().min(1).max(5).optional(),
    articleRef: z.string().optional(),
});

const questionsResponseSchema = z.union([
    z.array(generatedQuestionSchema),
    z.object({ questions: z.array(generatedQuestionSchema) }),
]);

const photoResponseSchema = z.object({
    concept: z.string().min(1).max(120),
    question: z.string().min(1),
    answer: z.string().min(1),
    relatedTopicId: z.string().optional(),
    availableQuestionsCount: z.number().int().min(0).max(50),
});

const hintResponseSchema = z.object({
    hint: z.string().min(1),
    articleRef: z.string().optional(),
});

function normalizeQuestion(
    q: z.infer<typeof generatedQuestionSchema>,
    fallbackTopicId: string,
    fallbackDifficulty: 'easy' | 'medium' | 'hard',
): GeneratedQuestion {
    return {
        id: q.id ?? randomUUID(),
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex as 0 | 1 | 2 | 3,
        explanation: q.explanation,
        topicId: q.topicId ?? fallbackTopicId,
        topic: q.topic ?? topicIdToLabel(q.topicId ?? fallbackTopicId),
        difficulty: q.difficulty ?? fallbackDifficulty,
        difficultyScore: q.difficultyScore,
        articleRef: q.articleRef,
    };
}

// ─── Cálculo determinista de distribución del test quirúrgico ─────────────────

function computeSurgicalDistribution(params: GenerateSurgicalTestParams): SurgicalTestResult['distribution'] {
    const patterns = params.errorPatterns;
    if (patterns.length === 0) return [];

    const totalFail = patterns.reduce((s, p) => s + p.failRate, 0);

    // Primer reparto proporcional (mínimo 1 por tema).
    const raw = patterns.map((p) => ({
        topicId: p.topicId,
        topic: p.topic,
        share: totalFail > 0 ? p.failRate / totalFail : 1 / patterns.length,
    }));
    const distribution = raw.map((r) => ({
        topicId: r.topicId,
        topic: r.topic,
        count: Math.max(1, Math.round(r.share * params.count)),
        percentage: Math.round(r.share * 100),
    }));

    // Ajuste fino: sum(count) puede pasarse o quedarse corto por redondeos.
    // Compensamos sobre el tema con mayor share.
    const diff = params.count - distribution.reduce((s, d) => s + d.count, 0);
    if (diff !== 0) {
        const idx = raw.reduce((best, r, i) => (r.share > raw[best]!.share ? i : best), 0);
        distribution[idx]!.count = Math.max(1, distribution[idx]!.count + diff);
    }

    return distribution;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────
// Los prompts en español viven aquí para no depender de leer .md en runtime.
// Copia sincronizada con packages/ai/prompts/*.md (actualizar ambos sitios).

const QUESTIONS_SYSTEM_PROMPT = `Eres un redactor experto en oposiciones públicas españolas (Justicia, Policía Nacional, Hacienda, Administración General). Escribes preguntas tipo test de calidad de examen oficial, basadas en legislación española vigente (Constitución 1978, Ley 39/2015, Ley 40/2015, Código Penal, Estatuto de los Trabajadores, etc.).

Reglas obligatorias:
- Exactamente 4 opciones (índices 0-3), una sola correcta.
- Las opciones NUNCA llevan prefijo "A)", "A.", "a) " ni similares — SOLO el texto
  de la opción. La app añade la letra por su cuenta. Ejemplo correcto: "3 meses".
  Ejemplo INCORRECTO: "A) 3 meses" o "a. 3 meses".
- El campo "correctIndex" (0, 1, 2 o 3) marca la opción correcta.
- La explicación cita el artículo/norma concreta cuando sea posible.
- Español formal, estilo examen oficial. Nada de emojis, coloquialismos ni preguntas capciosas.
- No repitas preguntas: cada texto debe ser único dentro del array.

Devuelve SIEMPRE un objeto JSON con la forma exacta:
{"questions":[{"text":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"...","topicId":"...","topic":"...","difficulty":"easy|medium|hard","articleRef":"art. X Ley Y"}]}`;

function renderQuestionsUserPrompt(p: GenerateQuestionsParams): string {
    const topicLabel = topicIdToLabel(p.topicId);
    const difficultyDesc: Record<string, string> = {
        easy: 'definiciones directas o artículos concretos',
        medium: 'razonamiento o comparación entre normas',
        hard: 'casos prácticos, excepciones, jurisprudencia',
    };
    const exclude = p.excludeIds && p.excludeIds.length > 0
        ? `\nEvita generar preguntas semánticamente equivalentes a las que ya vio el usuario (IDs: ${p.excludeIds.slice(0, 20).join(', ')}${p.excludeIds.length > 20 ? '...' : ''}).`
        : '';
    return `Genera ${p.count} preguntas tipo test sobre "${topicLabel}" (topicId="${p.topicId}") para la oposición "${p.oposicion}".
Dificultad: ${p.difficulty} (${difficultyDesc[p.difficulty]}).${exclude}

Devuelve exactamente ${p.count} objetos en el array "questions". Cada pregunta debe traer "topicId":"${p.topicId}" y "topic":"${topicLabel}".`;
}

const PHOTO_SYSTEM_PROMPT = `Eres el motor de Foto-Test de OPOX. Recibes una imagen tomada por un opositor: puede ser un apunte manuscrito, una página de manual, un cuadro sinóptico o una pregunta de examen. Tu tarea:

1. Identificar el concepto jurídico/administrativo principal visible en la imagen.
2. Redactar una pregunta tipo test corta y clara sobre ese concepto.
3. Escribir la respuesta correcta con explicación breve y referencia legal si aplica.

Si la imagen está borrosa, en blanco o es ilegible, devuelve {"error":"IMAGE_NOT_READABLE"}.
Si la imagen no tiene contenido jurídico/administrativo, devuelve un objeto normal con "availableQuestionsCount": 0 y "concept" describiendo lo que ves.

Devuelve SIEMPRE un objeto JSON con la forma exacta:
{"concept":"nombre del concepto (máx. 80 chars)","question":"pregunta tipo test (máx. 200 chars)","answer":"respuesta + explicación con referencia legal","relatedTopicId":"id-del-tema-si-lo-reconoces","availableQuestionsCount": N}

Valores posibles de relatedTopicId: "all", "ley-39", "ley-40", "constitucion", "penal", "laboral". Omite el campo si no puedes identificar el tema con certeza.
availableQuestionsCount: estimación entera entre 5 y 30 de cuántas preguntas distintas se podrían generar sobre este concepto (0 si la imagen no tiene contenido jurídico).`;

function renderPhotoUserPrompt(oposicion: string): string {
    return `Analiza esta imagen del opositor. Su oposición es "${oposicion}", enfoca el análisis en ese contexto. Responde en español formal.`;
}

const SURGICAL_SYSTEM_PROMPT = `Eres el generador de tests quirúrgicos de OPOX. El usuario tiene puntos débiles concretos y necesita atacar esos temas con preguntas EXIGENTES (siempre dificultad "hard"): casos prácticos, excepciones, jurisprudencia, detalles técnicos.

Todas las preguntas deben ser de nivel hard. Cada pregunta cita la norma exacta en la explicación. Nada de preguntas fáciles ni de definición.

Las opciones NUNCA llevan prefijo "A)", "A.", "a) " ni similares — SOLO el texto de la opción. La app añade la letra por su cuenta.

Devuelve SIEMPRE un objeto JSON con la forma:
{"questions":[{"text":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"...","topicId":"...","topic":"...","difficulty":"hard","articleRef":"art. X Ley Y"}]}`;

function renderSurgicalUserPrompt(oposicion: string, distribution: SurgicalTestResult['distribution']): string {
    const total = distribution.reduce((s, d) => s + d.count, 0);
    const lines = distribution.map((d) => `- ${d.count} preguntas sobre "${d.topic}" (topicId="${d.topicId}")`).join('\n');
    return `Genera exactamente ${total} preguntas hard para la oposición "${oposicion}", repartidas así:

${lines}

Devuelve las preguntas en el array "questions" respetando el orden anterior (primero las del primer tema, luego las del segundo, etc). Cada pregunta debe traer su "topicId" y "topic" correspondientes.`;
}

const HINT_SYSTEM_PROMPT = `Eres el Tutor IA de OPOX. Un opositor está bloqueado en una pregunta y pidió una pista. Tu misión: ayudarle a RAZONAR, nunca decirle la respuesta.

Reglas obligatorias:
- NO menciones la opción correcta por su letra (A/B/C/D) ni por su texto exacto.
- SÍ puedes referirte al tema, al artículo de ley o a principios generales.
- Tono didáctico, cercano, sin condescendencia. Español formal.
- Máximo 300 caracteres para el campo "hint".
- Incluye "articleRef" solo si hay una referencia legal concreta y útil.

Devuelve SIEMPRE un objeto JSON con la forma exacta:
{"hint":"pista que orienta sin revelar la respuesta","articleRef":"art. X Ley Y"}`;

function renderHintUserPrompt(p: HintParams): string {
    const opts = p.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n');
    return `Tema: ${p.topic} (topicId="${p.topicId}"). Oposición: ${p.oposicion}.

Pregunta:
${p.questionText}

Opciones:
${opts}

Genera una pista que le ayude a razonar sin revelar la respuesta.`;
}

function topicIdToLabel(topicId: string): string {
    const map: Record<string, string> = {
        all: 'Todo el temario',
        'ley-39': 'Ley 39/2015 (Procedimiento Administrativo Común)',
        'ley-40': 'Ley 40/2015 (Régimen Jurídico del Sector Público)',
        constitucion: 'Constitución Española 1978',
        penal: 'Derecho Penal (parte general)',
        laboral: 'Estatuto de los Trabajadores',
        admin: 'Derecho Administrativo',
    };
    return map[topicId] ?? topicId;
}
