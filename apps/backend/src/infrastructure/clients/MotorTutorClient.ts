import type { ITutorAiClient, TutorAiChatParams, TutorAiChatResult } from '../../domain/repositories/ITutorAiClient';

/** Cliente HTTP para el Motor IA — Aula Virtual (/classroom). */
export class MotorTutorClient implements ITutorAiClient {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly timeoutMs: number;

    constructor(baseUrl: string, apiKey: string, timeoutMs = 15_000) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.timeoutMs = timeoutMs;
    }

    private async post<T>(path: string, body: unknown): Promise<T> {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
        try {
            const res = await fetch(`${this.baseUrl}${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey,
                },
                body: JSON.stringify(body),
                signal: ctrl.signal,
            });
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`Motor tutor ${path} → ${res.status}: ${text}`);
            }
            return res.json() as Promise<T>;
        } finally {
            clearTimeout(timer);
        }
    }

    async chat(params: TutorAiChatParams): Promise<TutorAiChatResult> {
        const body = {
            mensaje: params.message,
            ...(params.toneProfile && { tono: params.toneProfile }),
            ...(params.history?.length && {
                historial: params.history.map((m) => ({
                    rol: m.role === 'user' ? 'usuario' : 'asistente',
                    contenido: m.content,
                })),
            }),
            ...(params.topic && { tema: params.topic }),
        };

        const data = await this.post<{
            respuesta?: string;
            acciones_sugeridas?: Array<{ label: string; icon: string }>;
        }>('/v1/classroom/chat', body);

        return {
            content: data.respuesta ?? '',
            suggestedActions: data.acciones_sugeridas,
        };
    }

    async generateFlashcards(params: {
        topicId: string;
        topicTitle: string;
        oposicion: string;
        count?: number;
    }): Promise<Array<{ question: string; answer: string }>> {
        const data = await this.post<{
            tarjetas?: Array<{ pregunta: string; respuesta: string }>;
        }>('/v1/classroom/flashcards', {
            tema_id: params.topicId,
            titulo: params.topicTitle,
            oposicion: params.oposicion,
            cantidad: params.count ?? 10,
        });

        return (data.tarjetas ?? []).map((t) => ({
            question: t.pregunta,
            answer: t.respuesta,
        }));
    }

    async getSummary(params: {
        topicId: string;
        oposicion: string;
    }): Promise<Array<{ title: string; content: string }>> {
        const data = await this.post<{
            secciones?: Array<{ titulo: string; contenido: string }>;
        }>('/v1/classroom/resumen', {
            tema_id: params.topicId,
            oposicion: params.oposicion,
        });

        return (data.secciones ?? []).map((s) => ({
            title: s.titulo,
            content: s.contenido,
        }));
    }
}
