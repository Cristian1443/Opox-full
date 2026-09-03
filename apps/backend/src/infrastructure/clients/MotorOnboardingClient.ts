/** Pregunta del test de nivel en el formato que devuelve el Motor. */
export interface MotorLevelTestQuestion {
    id: number;
    tema: string;
    tema_label: string;
    enunciado: string;
    opciones: Array<{ id: string; texto: string }>;
    correcta: string; // 'A' | 'B' | 'C' | 'D'
}

/** Pregunta adaptada al formato que espera LevelTestInProgressScreen.js. */
export interface LevelTestQuestion {
    id: number;
    topic: string;
    topicLabel: string;
    question: string;
    options: Array<{ id: string; text: string }>;
    correct: string;
}

/** Cliente HTTP para el Motor IA — onboarding (test de nivel). */
export class MotorOnboardingClient {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly timeoutMs: number;

    constructor(baseUrl: string, apiKey: string, timeoutMs = 5_000) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.timeoutMs = timeoutMs;
    }

    async getLevelTestQuestions(
        oposicion: string,
        count = 20,
    ): Promise<LevelTestQuestion[]> {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
        try {
            const url = `${this.baseUrl}/v1/onboarding/preguntas?oposicion=${encodeURIComponent(oposicion)}&count=${count}`;
            const res = await fetch(url, {
                headers: { 'X-API-Key': this.apiKey },
                signal: ctrl.signal,
            });
            if (!res.ok) {
                throw new Error(`Motor onboarding → ${res.status}`);
            }
            const data = await res.json() as { preguntas?: MotorLevelTestQuestion[] };
            const preguntas = data.preguntas ?? [];
            if (!preguntas.length) throw new Error('Motor devolvió 0 preguntas');

            return preguntas.map((p): LevelTestQuestion => ({
                id: p.id,
                topic: p.tema,
                topicLabel: p.tema_label,
                question: p.enunciado,
                options: p.opciones.map((o) => ({ id: o.id, text: o.texto })),
                correct: p.correcta,
            }));
        } finally {
            clearTimeout(timer);
        }
    }
}
