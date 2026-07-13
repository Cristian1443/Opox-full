import type { AiApiContract, GeneratedQuestion, SurgicalTestResult } from '@opox/types';
import type { ITrainingRepository } from '../../domain';
import { PhotoAnalysisError } from '../../domain';

export class GenerateQuestionsUseCase {
    constructor(private readonly aiApi: AiApiContract) { }

    async execute(input: {
        userId: string;
        oposicion: string;
        topicId?: string;
        difficulty?: 'easy' | 'medium' | 'hard';
        count?: number;
    }): Promise<GeneratedQuestion[]> {
        return this.aiApi.generateQuestions({
            oposicion: input.oposicion,
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
        count?: number;
    }): Promise<SurgicalTestResult> {
        const patterns = await this.trainingRepo.listErrorPatterns(input.userId);

        if (patterns.length === 0) {
            // Sin historial aún — el stub devuelve un test genérico
            return this.aiApi.generateSurgicalTest({
                oposicion: input.oposicion,
                errorPatterns: [{ topicId: 'all', topic: 'Todo el temario', failRate: 50, domain: 50 }],
                count: input.count ?? 20,
            });
        }

        return this.aiApi.generateSurgicalTest({
            oposicion: input.oposicion,
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
