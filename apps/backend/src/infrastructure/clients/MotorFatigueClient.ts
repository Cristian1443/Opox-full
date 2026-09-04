import axios, { type AxiosInstance } from 'axios';
import { logger } from '@opox/utils';

export interface MotorFatigueInput {
    hrv?: number | null;
    fc_reposo?: number | null;
    sueno_horas?: number | null;
    fecha: string; // YYYY-MM-DD
}

export interface MotorFatigueSignal {
    id: string;
    label: string;
    nota?: string;
    valor: string;
    estado: 'ok' | 'alerta' | 'desconocido';
    severidad: 'ok' | 'warning' | 'critical' | 'unknown';
}

export interface MotorFatigueResult {
    nivel: 'bajo' | 'medio' | 'alto';
    semaforo: 'verde' | 'amarillo' | 'rojo';
    senales: MotorFatigueSignal[];
    recomendaciones: string[];
    historial_7_dias: Array<{ fecha: string; nivel: 'bajo' | 'medio' | 'alto' }>;
}

// Motor API real response (POST /v1/fatigue/biometrics)
interface MotorFatiguaApiResponse {
    user_id: string;
    nivel: 'verde' | 'amarillo' | 'rojo';
    mensaje?: string;
    metricas?: Record<string, { valor: number | null; nivel: string }>;
    baseline?: Record<string, unknown>;
    historico?: Array<{ fecha: string; hrv_ms?: number; fc_reposo?: number; horas_sueno?: number; nivel: string }>;
}

const COLOR_TO_NIVEL: Record<string, 'bajo' | 'medio' | 'alto'> = {
    verde: 'bajo',
    amarillo: 'medio',
    rojo: 'alto',
};
const COLOR_TO_SEMAFORO: Record<string, 'verde' | 'amarillo' | 'rojo'> = {
    verde: 'verde',
    amarillo: 'amarillo',
    rojo: 'rojo',
};

export class MotorFatigueClient {
    private readonly http: AxiosInstance;

    constructor(baseUrl: string, apiKey: string, timeoutMs = 10000) {
        this.http = axios.create({
            baseURL: baseUrl,
            timeout: timeoutMs,
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
            },
        });
        this.http.interceptors.response.use(
            (res) => res,
            (err) => {
                logger.warn('[motor-fatiga] error', {
                    url: err.config?.url,
                    status: err.response?.status,
                    detail: err.response?.data?.message ?? err.message,
                });
                return Promise.reject(err);
            },
        );
    }

    async analyze(input: MotorFatigueInput): Promise<MotorFatigueResult> {
        const body: Record<string, unknown> = {
            user_id: 'opox-backend',
            ts: input.fecha,
        };
        if (input.hrv != null) body.hrv_ms = input.hrv;
        if (input.fc_reposo != null) body.fc_reposo = input.fc_reposo;
        if (input.sueno_horas != null) body.horas_sueno = input.sueno_horas;

        const { data } = await this.http.post<MotorFatiguaApiResponse>('/v1/fatigue/biometrics', body);

        // Map Motor color-based nivel to OPOX bajo/medio/alto
        const nivel = COLOR_TO_NIVEL[data.nivel] ?? 'bajo';
        const semaforo = COLOR_TO_SEMAFORO[data.nivel] ?? 'verde';

        // Build senales from metricas
        const senales: MotorFatigueSignal[] = Object.entries(data.metricas ?? {}).map(([key, m]) => ({
            id: key,
            label: key.replace(/_/g, ' '),
            valor: m.valor != null ? String(m.valor) : 'Sin datos',
            estado: m.nivel === 'verde' ? 'ok' : m.nivel === 'rojo' ? 'alerta' : 'ok',
            severidad: m.nivel === 'rojo' ? 'critical' : m.nivel === 'amarillo' ? 'warning' : 'ok',
        }));

        const historial_7_dias = (data.historico ?? []).slice(0, 7).map((h) => ({
            fecha: typeof h.fecha === 'string' ? h.fecha.split('T')[0] : h.fecha,
            nivel: COLOR_TO_NIVEL[h.nivel] ?? 'bajo',
        }));

        return {
            nivel,
            semaforo,
            senales,
            recomendaciones: data.mensaje ? [data.mensaje] : [],
            historial_7_dias,
        };
    }
}
