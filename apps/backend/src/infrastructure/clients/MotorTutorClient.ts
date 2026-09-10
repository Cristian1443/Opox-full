import type { ITutorAiClient, TutorAiChatParams, TutorAiChatResult } from '../../domain/repositories/ITutorAiClient';

/** Cliente HTTP para el Motor IA — Aula Virtual.
 *  Rutas reales (2026-09-09): /v1/classroom/tutor, /v1/classroom/summary,
 *  /v1/classroom/flashcards/generate, /v1/classroom/podcast (POST + GET del mp3).
 *
 *  Todos los endpoints exigen X-API-Key (auth) + X-OpenAI-Key (BYOK: el Motor no
 *  lleva clave de OpenAI propia). Sin esta última, los jobs mueren con
 *  `falta_openai_key`.
 */
export class MotorTutorClient implements ITutorAiClient {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly openAiKey: string;
    private readonly timeoutMs: number;
    private readonly cursoId: string;

    // Timeout default subido a 60 s: el Motor RAG puede tardar 20-40 s en generar
    // respuestas largas del tutor (búsqueda en temario + composición). Con 15 s
    // caía frecuentemente al stub aunque el Motor terminaba respondiendo bien.
    constructor(baseUrl: string, apiKey: string, openAiKey: string, timeoutMs = 60_000, cursoId = '') {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.openAiKey = openAiKey;
        this.timeoutMs = timeoutMs;
        this.cursoId = cursoId;
    }

    private authHeaders(): Record<string, string> {
        return {
            'X-API-Key': this.apiKey,
            'X-OpenAI-Key': this.openAiKey,
        };
    }

    private async post<T>(path: string, body: unknown): Promise<T> {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
        try {
            const res = await fetch(`${this.baseUrl}${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.authHeaders(),
                },
                body: JSON.stringify(body),
                signal: ctrl.signal,
            });
            // 200 y 202 son ambos OK (podcast devuelve 202 al encolar el job).
            if (!res.ok && res.status !== 202) {
                const text = await res.text().catch(() => '');
                const err = new Error(`Motor tutor ${path} → ${res.status}: ${text.slice(0, 200)}`);
                (err as NodeJS.ErrnoException).code = res.status >= 500 ? 'MOTOR_SERVER_ERROR' : 'MOTOR_CLIENT_ERROR';
                throw err;
            }
            return res.json() as Promise<T>;
        } finally {
            clearTimeout(timer);
        }
    }

    async chat(params: TutorAiChatParams): Promise<TutorAiChatResult> {
        const body: Record<string, unknown> = {
            user_id: params.userId ?? 'opox-backend',
            curso_id: params.cursoId ?? this.cursoId,
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
            // acciones son trazas internas del Motor (tool calls RAG), no botones UI
            acciones?: unknown;
        }>('/v1/classroom/tutor', body);

        return {
            content: data.respuesta ?? '',
            // No mapeamos acciones del Motor — son trazas RAG internas, no sugerencias UI.
            // SendMessageUseCase aplica DEFAULT_SUGGESTED_ACTIONS como fallback.
            suggestedActions: undefined,
        };
    }

    async generateFlashcards(params: {
        topicId: string;
        topicTitle: string;
        oposicion: string;
        cursoId?: string;
        count?: number;
    }): Promise<Array<{ question: string; answer: string }>> {
        // Motor returns a direct array of {id, tema_id, front, back}.
        // Se pide n=15 por defecto (antes 10) para más variedad — el Motor
        // determinista tiende a repetir las mismas 5 primeras, y así hay más
        // tarjetas visibles al usuario en cada mazo.
        const data = await this.post<Array<{ front?: string; back?: string }>>(
            '/v1/classroom/flashcards/generate',
            {
                curso_id: params.cursoId ?? this.cursoId,
                tema_id: params.topicId,
                n: params.count ?? 15,
            },
        );

        if (!Array.isArray(data)) return [];
        return data.map((t) => ({
            question: t.front ?? '',
            answer: t.back ?? '',
        }));
    }

    // ─── Podcast ──────────────────────────────────────────────────────────────
    // El Motor genera el podcast asíncrono: POST /v1/classroom/podcast/generate → job_id,
    // luego se hace polling de GET /v1/jobs/{id} hasta estado 'done' y se recupera
    // la URL relativa del mp3.
    async generatePodcast(params: {
        topicId: string;
        userId: string;
        cursoId?: string;
        duracion?: 'corta' | 'media';
        velocidad?: number;
    }): Promise<{ filename: string; mp3Url: string; estimatedSeconds: number }> {
        const bodyGen: Record<string, unknown> = {
            user_id: params.userId,
            curso_id: params.cursoId ?? this.cursoId,
            tema_id: params.topicId,
            duracion: params.duracion ?? 'media',
            velocidad: params.velocidad ?? 1.0,
        };

        // Endpoint real: POST /v1/classroom/podcast (sin /generate). Devuelve 202 con job_id.
        const job = await this.post<{ job_id?: string }>(
            '/v1/classroom/podcast',
            bodyGen,
        );
        if (!job.job_id) throw new Error('Motor no devolvió job_id');

        // Polling hasta done (o error). Timeout total 2 min.
        const start = Date.now();
        const maxWaitMs = 120_000;
        const intervalMs = 3_000;

        while (Date.now() - start < maxWaitMs) {
            await new Promise((r) => setTimeout(r, intervalMs));

            const status = await this.get<{
                id?: string;
                estado?: string;
                mensaje?: string;
                resultado?: { archivo?: string; url?: string };
            }>(`/v1/jobs/${job.job_id}`);

            if (status.estado === 'done' && status.resultado?.url) {
                const relative = status.resultado.url;
                // URL completa del mp3 — el mobile la reproduce directamente.
                const mp3Url = relative.startsWith('http')
                    ? relative
                    : `${this.baseUrl}${relative}`;
                const estimatedSeconds = params.duracion === 'corta' ? 300 : 600;
                return {
                    filename: status.resultado.archivo ?? '',
                    mp3Url,
                    estimatedSeconds,
                };
            }
            if (status.estado === 'error') {
                throw new Error(`Motor podcast job error: ${status.mensaje ?? 'unknown'}`);
            }
        }

        throw new Error('Motor podcast job timeout (2 min)');
    }

    // GET auxiliar para polling de jobs — mismo timeout/auth que POST.
    private async get<T>(path: string): Promise<T> {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
        try {
            const res = await fetch(`${this.baseUrl}${path}`, {
                headers: this.authHeaders(),
                signal: ctrl.signal,
            });
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`Motor GET ${path} → ${res.status}: ${text.slice(0, 200)}`);
            }
            return res.json() as Promise<T>;
        } finally {
            clearTimeout(timer);
        }
    }

    async getSummary(params: {
        topicId: string;
        oposicion: string;
        cursoId?: string;
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
                desarrollo?: string | string[];
                puntos_examen?: string[];
            };
        }>('/v1/classroom/summary', {
            curso_id: params.cursoId ?? this.cursoId,
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
            const desarrollo = Array.isArray(r.desarrollo)
                ? r.desarrollo.join('\n\n')
                : r.desarrollo;
            sections.push({ title: 'Desarrollo', content: desarrollo });
        }
        if (r.puntos_examen?.length) {
            sections.push({ title: 'Puntos de examen', content: r.puntos_examen.join('\n') });
        }
        return sections;
    }
}
