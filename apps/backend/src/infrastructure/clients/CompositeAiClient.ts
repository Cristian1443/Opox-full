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

export interface CompositeAiConfig {
    /** Motor de IA del cliente — cubre generateQuestions y generateSurgicalTest (RAG). */
    questions: AiApiContract;
    /** Cliente OpenAI directo — cubre todo lo que el Motor no cubre. */
    fallback: AiApiContract;
}

/**
 * Implementa AiApiContract enrutando cada método al cliente más adecuado:
 *   - generateQuestions / generateSurgicalTest → Motor de IA (RAG + evidencia verbatim)
 *   - todo lo demás → OpenAI directo (analyzePhoto, generateHint, Bloque 9, Bloque 10)
 *
 * Se activa en container.ts cuando MOTOR_API_BASE_URL y MOTOR_API_KEY están rellenos.
 * Sin ellos, container.ts usa AiApiClient directamente (sin esta envoltura).
 */
export class CompositeAiClient implements AiApiContract {
    constructor(private readonly cfg: CompositeAiConfig) {}

    async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
        try {
            return await this.cfg.questions.generateQuestions(params);
        } catch (err) {
            logger.warn('[composite-ai] Motor falló en generateQuestions — usando OpenAI', {
                error: err instanceof Error ? err.message : String(err),
            });
            return this.cfg.fallback.generateQuestions(params);
        }
    }

    async generateSurgicalTest(params: GenerateSurgicalTestParams): Promise<SurgicalTestResult> {
        try {
            return await this.cfg.questions.generateSurgicalTest(params);
        } catch (err) {
            logger.warn('[composite-ai] Motor falló en generateSurgicalTest — usando OpenAI', {
                error: err instanceof Error ? err.message : String(err),
            });
            return this.cfg.fallback.generateSurgicalTest(params);
        }
    }

    analyzePhoto(params: AnalyzePhotoParams): Promise<PhotoTestResult> {
        return this.cfg.fallback.analyzePhoto(params);
    }

    generateHint(params: HintParams): Promise<HintResult> {
        return this.cfg.fallback.generateHint(params);
    }

    analyzeNoteDocument(params: AnalyzeNoteDocumentParams): Promise<AnalyzeNoteDocumentResult> {
        return this.cfg.fallback.analyzeNoteDocument(params);
    }

    generateTagsFromNote(params: GenerateTagsFromNoteParams): Promise<GenerateTagsFromNoteResult> {
        return this.cfg.fallback.generateTagsFromNote(params);
    }

    generateQuestionsFromNote(params: GenerateQuestionsFromNoteParams): Promise<GenerateQuestionsFromNoteResult> {
        return this.cfg.fallback.generateQuestionsFromNote(params);
    }

    generateBoeMiniTest(params: GenerateBoeMiniTestParams): Promise<BoeMiniTestAiResult> {
        return this.cfg.fallback.generateBoeMiniTest(params);
    }
}
