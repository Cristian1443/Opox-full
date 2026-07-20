import axios, { type AxiosInstance } from 'axios';
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
 * Cliente real de la API de IA.
 *
 * El responsable de IA implementa los tres métodos de abajo llamando
 * al proveedor que corresponda (OpenAI, Anthropic, Azure, etc.).
 *
 * Ver los prompts y ejemplos de entrada/salida en:
 *   packages/ai/prompts/generate-questions.md
 *   packages/ai/prompts/analyze-photo.md
 *   packages/ai/prompts/generate-surgical-test.md
 *
 * Env vars necesarias (apps/backend/.env):
 *   AI_API_BASE_URL    → URL base del proveedor
 *   AI_API_KEY         → clave secreta (nunca en el móvil)
 *   AI_API_DEFAULT_MODEL → ej. "gpt-4o" / "claude-sonnet-4-6"
 *   AI_API_TIMEOUT_MS  → timeout en ms (default 30000)
 */
export class AiApiClient implements AiApiContract {
    private readonly http: AxiosInstance;

    constructor(private readonly config: AiApiConfig) {
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
                logger.warn('[ai-api] error', {
                    url: err.config?.url,
                    status: err.response?.status,
                    message: err.message,
                });
                return Promise.reject(err);
            },
        );
    }

    getDefaultModel(): string {
        return this.config.defaultModel;
    }

    // ─── Métodos a implementar ────────────────────────────────────────────────
    //
    // Cada método debe:
    // 1. Construir el prompt usando las plantillas de packages/ai/prompts/
    // 2. Llamar al proveedor de IA via this.http (o SDK directo si aplica)
    // 3. Parsear la respuesta y devolverla con la forma exacta del tipo de retorno
    // 4. Lanzar un Error descriptivo si la respuesta no tiene la forma esperada

    async generateQuestions(_params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
        // TODO: implementar — ver packages/ai/prompts/generate-questions.md
        throw new Error('[AiApiClient] generateQuestions no implementado. Ver packages/ai/prompts/generate-questions.md');
    }

    async analyzePhoto(_params: AnalyzePhotoParams): Promise<PhotoTestResult> {
        // TODO: implementar — ver packages/ai/prompts/analyze-photo.md
        throw new Error('[AiApiClient] analyzePhoto no implementado. Ver packages/ai/prompts/analyze-photo.md');
    }

    async generateSurgicalTest(_params: GenerateSurgicalTestParams): Promise<SurgicalTestResult> {
        // TODO: implementar — ver packages/ai/prompts/generate-surgical-test.md
        throw new Error('[AiApiClient] generateSurgicalTest no implementado. Ver packages/ai/prompts/generate-surgical-test.md');
    }

    async generateHint(_params: HintParams): Promise<HintResult> {
        // TODO: implementar — ver packages/ai/BRIEF_IA_BLOQUE7.md
        throw new Error('[AiApiClient] generateHint no implementado. Ver packages/ai/BRIEF_IA_BLOQUE7.md');
    }
}
