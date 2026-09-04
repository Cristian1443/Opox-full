import type { ITutorAiClient, TutorAiChatParams, TutorAiChatResult } from '../../domain/repositories/ITutorAiClient';

/** Cliente HTTP para el Motor IA — Aula Virtual.
 *  Rutas reales (2026-09-04): /v1/classroom/tutor, /v1/classroom/summary, /v1/classroom/flashcards/generate
 */
export class MotorTutorClient implements ITutorAiClient {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly timeoutMs: number;
    private readonly cursoId: string;

    constructor(baseUrl: string, apiKey: string, timeoutMs = 15_000, cursoId = '') {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.timeoutMs = timeoutMs;
        this.cursoId = cursoId;
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
                throw new Error(`Motor tutor ${path} → ${res.status}: ${text.slice(0, 200)}`);
            }
            return res.json() as Promise<T>;
        } finally {
            clearTimeout(timer);
        }
    }

    async chat(params: TutorAiChatParams): Promise<TutorAiChatResult> {
        const body: Record<string, unknown> = {
            user_id: 'opox-backend',
            curso_id: this.cursoId,
            mensaje: params.message,
        };
        if (params.toneProfile) body.tono = params.toneProfile;
        if (params.history?.length) {
            body.historial = params.history.map((m) => ({
                rol: m.role === 'user' ? 'usuario' : 'asistente',
                contenido: m.content,
            }));
        }
        if (params.topic) body.tema = params.topic;

        const data = await this.post<{
            respuesta?: string;
            acciones?: Array<{ label: string; icon: string }>;
        }>('/v1/classroom/tutor', body);

        return {
            content: data.respuesta ?? '',
            suggestedActions: data.acciones,
        };
    }

    async generateFlashcards(params: {
        topicId: string;
        topicTitle: string;
        oposicion: string;
        count?: number;
    }): Promise<Array<{ question: string; answer: string }>> {
        // Motor returns a direct array of {id, tema_id, front, back}
        const data = await this.post<Array<{ front?: string; back?: string }>>(
            '/v1/classroom/flashcards/generate',
            {
                curso_id: this.cursoId,
                tema_id: params.topicId,
                n: params.count ?? 10,
            },
        );

        if (!Array.isArray(data)) return [];
        return data.map((t) => ({
            question: t.front ?? '',
            answer: t.back ?? '',
        }));
    }

    async getSummary(params: {
        topicId: string;
        oposicion: string;
        detailLevel?: number;
    }): Promise<Array<{ title: string; content: string }>> {
        // Map detailLevel (0|1|2) → Motor nivel ('esquema'|'medio'|'profundo')
        const nivelMap: Record<number, string> = { 0: 'esquema', 1: 'medio', 2: 'profundo' };
        const nivel = nivelMap[params.detailLevel ?? 1] ?? 'medio';

        const data = await this.post<{
            tema_id?: string;
            nivel?: string;
            resumen?: {
                titulo?: string;
                ideas_clave?: string[];
                desarrollo?: string;
            };
        }>('/v1/classroom/summary', {
            curso_id: this.cursoId,
            tema_id: params.topicId,
            nivel,
        });

        const r = data.resumen;
        if (!r) return [];
        const sections: Array<{ title: string; content: string }> = [];
        if (r.titulo) {
            sections.push({ title: r.titulo, content: (r.ideas_clave ?? []).join('\n') });
        }
        if (r.desarrollo) {
            sections.push({ title: 'Desarrollo', content: r.desarrollo });
        }
        return sections;
    }
}
