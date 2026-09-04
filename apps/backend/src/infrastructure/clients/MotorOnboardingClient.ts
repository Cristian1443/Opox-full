import { logger } from '@opox/utils';

/** Pregunta del banco del Motor (GET /v1/courses/{id}/questions) */
interface MotorBankQuestion {
    id: string;
    enunciado: string;
    opciones: string[];
    correcta_idx: number;
    dificultad: string;
    tema_id: string;
    explicacion?: string;
}

/** Pregunta adaptada al formato que espera LevelTestInProgressScreen.js. */
export interface LevelTestQuestion {
    id: number;
    topic: string;
    topicLabel: string;
    question: string;
    options: Array<{ id: string; text: string }>;
    correct: string; // 'A' | 'B' | 'C' | 'D'
}

const IDX_TO_LETTER = ['A', 'B', 'C', 'D'] as const;

/** Cliente HTTP para el Motor IA — onboarding (test de nivel).
 *  Obtiene preguntas del banco del curso (/v1/courses/{id}/questions)
 *  que incluye correcta_idx, a diferencia del job de placement-test.
 */
export class MotorOnboardingClient {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly timeoutMs: number;
    private readonly cursoId: string;

    constructor(baseUrl: string, apiKey: string, timeoutMs = 5_000, cursoId = '') {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.timeoutMs = timeoutMs;
        this.cursoId = cursoId;
    }

    async getLevelTestQuestions(
        _oposicion: string,
        count = 20,
    ): Promise<LevelTestQuestion[]> {
        if (!this.cursoId) {
            throw new Error('MotorOnboardingClient: cursoId no configurado');
        }

        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
        try {
            const url = `${this.baseUrl}/v1/courses/${this.cursoId}/questions?limit=${count}`;
            const res = await fetch(url, {
                headers: { 'X-API-Key': this.apiKey },
                signal: ctrl.signal,
            });
            if (!res.ok) {
                throw new Error(`Motor onboarding bank → ${res.status}`);
            }
            const data = await res.json() as MotorBankQuestion[];
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Motor devolvió 0 preguntas del banco');
            }

            logger.info('[motor-onboarding] preguntas del banco cargadas', { count: data.length, cursoId: this.cursoId });

            return data.map((p, idx): LevelTestQuestion => ({
                id: idx + 1,
                topic: p.tema_id,
                topicLabel: p.tema_id,
                question: p.enunciado,
                options: p.opciones.map((text, i) => ({
                    id: IDX_TO_LETTER[i] ?? String(i),
                    text,
                })),
                correct: IDX_TO_LETTER[p.correcta_idx] ?? 'A',
            }));
        } finally {
            clearTimeout(timer);
        }
    }
}
