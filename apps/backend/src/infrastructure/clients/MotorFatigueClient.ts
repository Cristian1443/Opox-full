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
        const { data } = await this.http.post<MotorFatigueResult>('/v1/fatigue/analyze', input);
        return data;
    }
}
