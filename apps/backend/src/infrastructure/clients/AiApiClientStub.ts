import { randomUUID } from 'crypto';
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
    BoeMiniTestQuestion,
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

    async generateHint(params: HintParams): Promise<HintResult> {
        logger.info('[ai-stub] generateHint', { topicId: params.topicId });

        await delay(500);

        return {
            hint: `Recuerda el marco legal de "${params.topic}": fíjate en la opción que sea más coherente con los principios generales del procedimiento administrativo. Descarta las opciones con plazos o condiciones extremas.`,
            articleRef: 'art. 21 Ley 39/2015',
        };
    }

    // ── Bloque 9 · Factoría de Apuntes ───────────────────────────────────────
    // Stubs con datos realistas para que el pipeline de análisis sea ejecutable
    // sin IA real. Cuando el equipo IA entregue el brief 9, se sustituyen en AiApiClient.

    async analyzeNoteDocument(params: AnalyzeNoteDocumentParams): Promise<AnalyzeNoteDocumentResult> {
        logger.info('[ai-stub] analyzeNoteDocument', { pages: params.pages.length });
        await delay(600);
        return {
            suggestedTitle: 'Apunte digitalizado',
            pages: params.pages.map(p => ({
                pageNumber: p.pageNumber,
                extractedText:
                    'Texto de ejemplo extraído de la página ' + p.pageNumber +
                    '. La Ley 39/2015 regula el procedimiento administrativo común de las Administraciones Públicas. ' +
                    'El plazo general para resolver es de 3 meses (art. 21.2).',
                ocrConfidence: 0.92,
            })),
        };
    }

    async generateTagsFromNote(_params: GenerateTagsFromNoteParams): Promise<GenerateTagsFromNoteResult> {
        logger.info('[ai-stub] generateTagsFromNote');
        await delay(300);
        return {
            tags: ['Constitución', 'Derechos fundamentales', 'Título I'],
        };
    }

    // ── Bloque 10 · Monitor BOE ───────────────────────────────────────────────

    async generateBoeMiniTest(params: GenerateBoeMiniTestParams): Promise<BoeMiniTestAiResult> {
        logger.info('[ai-stub] generateBoeMiniTest', { articulo: params.articulo, count: params.count });
        await delay(400);

        const all: BoeMiniTestQuestion[] = [
            {
                id: 'boe-q1',
                context: `${params.articulo} modificado`,
                question: `Tras la modificación del ${params.articulo} de la ${params.ley}, ¿qué colectivo se añade expresamente entre los obligados a relacionarse electrónicamente con la Administración?`,
                options: [
                    'Los autónomos sin colegiación obligatoria.',
                    'Los empleados públicos en el ejercicio de sus funciones.',
                    'Los ciudadanos mayores de 18 años.',
                ],
                correctIndex: 1,
                explanation: `La nueva redacción añade expresamente a los empleados públicos en el ejercicio de sus funciones (${params.articulo}).`,
            },
            {
                id: 'boe-q2',
                context: `${params.articulo} — nueva redacción`,
                question: `Según la redacción vigente del ${params.articulo}, ¿cómo queda recogida la actividad profesional colegiada?`,
                options: [
                    'Se exige que la colegiación sea obligatoria para el trámite concreto.',
                    'Se simplifica a "quienes ejerzan cualquier actividad profesional colegiada".',
                    'Se elimina la referencia a profesionales colegiados.',
                ],
                correctIndex: 1,
                explanation: `La redacción vigente simplifica el texto suprimiendo la referencia a la obligatoriedad de la colegiación (${params.articulo}).`,
            },
            {
                id: 'boe-q3',
                context: `${params.articulo} — efecto práctico`,
                question: `¿Cuál es el efecto práctico de la modificación del ${params.articulo} respecto a los empleados públicos?`,
                options: [
                    'Quedan exentos de la obligación de relacionarse electrónicamente.',
                    'Deben relacionarse electrónicamente solo en procedimientos sancionadores.',
                    'Deben relacionarse electrónicamente en el ejercicio de sus funciones.',
                ],
                correctIndex: 2,
                explanation: `El nuevo apartado incorporado en ${params.articulo} obliga a los empleados públicos a relacionarse electrónicamente en el ejercicio de sus funciones.`,
            },
        ];

        return { questions: all.slice(0, params.count) };
    }

    async generateQuestionsFromNote(params: GenerateQuestionsFromNoteParams): Promise<GenerateQuestionsFromNoteResult> {
        logger.info('[ai-stub] generateQuestionsFromNote', { count: params.count, tags: params.tags.length });
        await delay(500);
        const bank = STUB_QUESTIONS_BY_TOPIC['constitucion'] ?? DEFAULT_BANK;
        const questions = Array.from({ length: params.count }).map((_, i) => {
            const template = bank[i % bank.length] ?? DEFAULT_BANK[0]!;
            return {
                id: randomUUID(),
                text: template.text,
                options: template.options,
                correctIndex: template.correctIndex,
                explanation: template.explanation,
                topicId: 'constitucion',
                topic: 'Constitución Española',
                difficulty: 'medium' as const,
                tag: params.tags[i % Math.max(1, params.tags.length)],
            };
        });
        return { questions };
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

