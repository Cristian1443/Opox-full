import { randomUUID } from 'crypto';
import type {
    AiApiContract,
    GenerateQuestionsParams,
    GeneratedQuestion,
    AnalyzePhotoParams,
    PhotoTestResult,
    GenerateSurgicalTestParams,
    SurgicalTestResult,
} from '@opox/types';
import { logger } from '@opox/utils';

/**
 * Implementación stub de AiApiContract.
 *
 * Devuelve datos realistas con la forma exacta del contrato real.
 * El container.ts la usa cuando las env vars AI_* no están configuradas,
 * de modo que todo el backend de entrenamiento funciona sin IA real.
 *
 * Cuando el responsable de IA entregue la implementación real, este
 * archivo queda obsoleto — el container usará AiApiClient en su lugar.
 */
export class AiApiClientStub implements AiApiContract {

    async generateQuestions(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
        logger.info('[ai-stub] generateQuestions', { count: params.count, difficulty: params.difficulty, topicId: params.topicId });

        await delay(400);

        return Array.from({ length: params.count }, (_, i) =>
            buildStubQuestion(i, params.difficulty, params.topicId),
        );
    }

    async analyzePhoto(_params: AnalyzePhotoParams): Promise<PhotoTestResult> {
        logger.info('[ai-stub] analyzePhoto');

        await delay(1800);

        return {
            concept: 'Plazos en el procedimiento administrativo (Ley 39/2015)',
            question: '¿Cuál es el plazo general para resolver un procedimiento administrativo según la Ley 39/2015?',
            answer: 'El plazo general es de 3 meses, salvo que una norma con rango de ley establezca un plazo mayor o menor (art. 21.2 Ley 39/2015).',
            relatedTopicId: 'ley-39',
            availableQuestionsCount: 12,
        };
    }

    async generateSurgicalTest(params: GenerateSurgicalTestParams): Promise<SurgicalTestResult> {
        logger.info('[ai-stub] generateSurgicalTest', { patterns: params.errorPatterns.length });

        await delay(600);

        // Distribuye preguntas proporcionalmente al failRate de cada patrón
        const totalFail = params.errorPatterns.reduce((s, p) => s + p.failRate, 0);
        const distribution = params.errorPatterns.map((p) => {
            const pct = totalFail > 0 ? Math.round((p.failRate / totalFail) * 100) : Math.round(100 / params.errorPatterns.length);
            const count = Math.max(1, Math.round((pct / 100) * params.count));
            return { topicId: p.topicId, topic: p.topic, count, percentage: pct };
        });

        const questions: GeneratedQuestion[] = distribution.flatMap((d) =>
            Array.from({ length: d.count }, (_, i) =>
                buildStubQuestion(i, 'medium', d.topicId, d.topic),
            ),
        );

        return { questions, distribution };
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

const STUB_QUESTIONS_BY_TOPIC: Record<string, Array<{ text: string; options: [string, string, string, string]; correctIndex: 0 | 1 | 2 | 3; explanation: string }>> = {
    'ley-39': [
        {
            text: '¿Cuál es el plazo general para resolver un procedimiento administrativo según la Ley 39/2015?',
            options: ['1 mes', '2 meses', '3 meses', '6 meses'],
            correctIndex: 2,
            explanation: 'El art. 21.2 Ley 39/2015 fija el plazo general en 3 meses salvo norma especial.',
        },
        {
            text: '¿Qué efectos tiene el silencio administrativo positivo?',
            options: [
                'La solicitud se entiende desestimada',
                'La solicitud se entiende estimada',
                'El procedimiento queda suspendido',
                'El interesado pierde el derecho a recurrir',
            ],
            correctIndex: 1,
            explanation: 'El silencio positivo otorga al interesado los derechos y facultades solicitados (art. 24.1 Ley 39/2015).',
        },
    ],
    'constitucion': [
        {
            text: '¿Cuántos artículos tiene la Constitución Española de 1978?',
            options: ['139', '157', '169', '183'],
            correctIndex: 2,
            explanation: 'La CE tiene 169 artículos, distribuidos en un Título Preliminar y 10 Títulos.',
        },
    ],
    'default': [
        {
            text: '¿Cuál es el órgano supremo de la Administración General del Estado?',
            options: ['El Congreso de los Diputados', 'El Consejo de Estado', 'El Consejo de Ministros', 'El Tribunal Supremo'],
            correctIndex: 2,
            explanation: 'El Consejo de Ministros es el órgano colegiado de gobierno y administración (art. 98 CE).',
        },
        {
            text: '¿Qué principio rige la actuación de las Administraciones Públicas según la Ley 40/2015?',
            options: ['Principio de legalidad', 'Principio de eficacia', 'Principio de jerarquía', 'Todos los anteriores'],
            correctIndex: 3,
            explanation: 'El art. 3 Ley 40/2015 enumera legalidad, jerarquía, descentralización, eficacia, economía, eficiencia y servicio al ciudadano, entre otros.',
        },
    ],
};

const DEFAULT_BANK = STUB_QUESTIONS_BY_TOPIC['default']!;

function buildStubQuestion(
    index: number,
    difficulty: 'easy' | 'medium' | 'hard',
    topicId: string,
    topicLabel?: string,
): GeneratedQuestion {
    const bank = STUB_QUESTIONS_BY_TOPIC[topicId] ?? DEFAULT_BANK;
    const template = bank[index % bank.length] ?? DEFAULT_BANK[0]!;
    const topic = topicLabel ?? topicIdToLabel(topicId);

    return {
        id: randomUUID(),
        text: template.text,
        options: template.options,
        correctIndex: template.correctIndex,
        explanation: template.explanation,
        topicId,
        topic,
        difficulty,
    };
}

function topicIdToLabel(topicId: string): string {
    const map: Record<string, string> = {
        'all': 'Todo el temario',
        'ley-39': 'Ley 39/2015',
        'ley-40': 'Ley 40/2015',
        'constitucion': 'Constitución Española',
        'penal': 'Derecho Penal',
        'laboral': 'Derecho Laboral',
        'admin': 'Derecho Administrativo',
    };
    return map[topicId] ?? topicId;
}
