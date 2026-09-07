import type { AiApiContract, GeneratedQuestion, SurgicalTestResult, HintResult } from '@opox/types';
import type { ITrainingRepository } from '../../domain';
import { PhotoAnalysisError } from '../../domain';
import { logger } from '@opox/utils';

// ─── Resolución de curso (multi-curso) ────────────────────────────────────────

export class GetCursoIdUseCase {
    constructor(
        private readonly trainingRepo: ITrainingRepository,
        private readonly defaultCursoId: string,
    ) {}

    /** Devuelve el motor_curso_id para la oposición dada, o el defaultCursoId si no está mapeado. */
    async execute(oposicion: string | null | undefined): Promise<string> {
        if (!oposicion) return this.defaultCursoId;
        const id = await this.trainingRepo.getCursoId(oposicion);
        return id ?? this.defaultCursoId;
    }
}

// ─── Generación de preguntas ──────────────────────────────────────────────────

export class GenerateQuestionsUseCase {
    constructor(private readonly aiApi: AiApiContract) { }

    async execute(input: {
        userId: string;
        oposicion: string;
        cursoId?: string;
        topicId?: string;
        difficulty?: 'easy' | 'medium' | 'hard';
        count?: number;
    }): Promise<GeneratedQuestion[]> {
        return this.aiApi.generateQuestions({
            oposicion: input.oposicion,
            cursoId: input.cursoId,
            topicId: input.topicId ?? 'all',
            difficulty: input.difficulty ?? 'medium',
            count: input.count ?? 10,
            // No tenemos IDs históricos todavía — los error patterns dan contexto suficiente
            excludeIds: [],
        });
    }
}

export class AnalyzePhotoUseCase {
    constructor(private readonly aiApi: AiApiContract) { }

    async execute(input: {
        imageBase64: string;
        mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
        oposicion: string;
    }) {
        try {
            return await this.aiApi.analyzePhoto(input);
        } catch (err) {
            const msg = err instanceof Error ? err.message : undefined;
            throw new PhotoAnalysisError(
                msg === 'IMAGE_NOT_READABLE'
                    ? 'No pudimos leer la imagen. Asegúrate de que esté bien enfocada.'
                    : undefined,
            );
        }
    }
}

export class GenerateSurgicalTestUseCase {
    constructor(
        private readonly aiApi: AiApiContract,
        private readonly trainingRepo: ITrainingRepository,
    ) { }

    async execute(input: {
        userId: string;
        oposicion: string;
        cursoId?: string;
        count?: number;
    }): Promise<SurgicalTestResult> {
        const patterns = await this.trainingRepo.listErrorPatterns(input.userId);

        if (patterns.length === 0) {
            // Sin historial aún — el stub devuelve un test genérico
            return this.aiApi.generateSurgicalTest({
                oposicion: input.oposicion,
                cursoId: input.cursoId,
                errorPatterns: [{ topicId: 'all', topic: 'Todo el temario', failRate: 50, domain: 50 }],
                count: input.count ?? 20,
            });
        }

        return this.aiApi.generateSurgicalTest({
            oposicion: input.oposicion,
            cursoId: input.cursoId,
            errorPatterns: patterns.map((p) => ({
                topicId: p.topicId,
                topic: p.topic,
                failRate: p.failRate,
                domain: p.domain,
            })),
            count: input.count ?? 20,
        });
    }
}

export class GenerateHintUseCase {
    constructor(private readonly aiApi: AiApiContract) { }

    async execute(input: {
        questionId: string;
        questionText: string;
        options: [string, string, string, string];
        topicId: string;
        topic: string;
        oposicion: string;
        cursoId?: string;
    }): Promise<HintResult> {
        return this.aiApi.generateHint({
            questionText: input.questionText,
            options: input.options,
            topicId: input.topicId,
            topic: input.topic,
            oposicion: input.oposicion,
            cursoId: input.cursoId,
        });
    }
}

export class ReportQuestionUseCase {
    async execute(input: {
        userId: string;
        questionId: string;
        reason: string;
        details?: string;
    }): Promise<void> {
        // TODO: persistir en tabla question_reports — Supabase insert
        logger.info('[report] question reported', {
            userId: input.userId,
            questionId: input.questionId,
            reason: input.reason,
        });
    }
}
