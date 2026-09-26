import axios, { type AxiosInstance } from 'axios';
import { logger } from '@opox/utils';

export interface MotorFatigueInput {
    userId?: string;
    hrv?: number | null;
    fc_reposo?: number | null;
    spo2?: number | null;
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
// Schema verificado contra https://ia.opox.ai/openapi.json (EstadoFatigaOut).
// `nivel` es 'verde' | 'ambar' | 'rojo' (NO 'amarillo' como creíamos).
// `metricas` y `baseline` son Record<string, number> — valores directos, sin
// wrapper { valor, nivel }.
interface MotorFatiguaApiResponse {
    user_id: string;
    nivel: 'verde' | 'ambar' | 'rojo';
    mensaje?: string;
    metricas?: Record<string, number>;
    baseline?: Record<string, number>;
    historico?: Array<{
        fecha: string;
        nivel: 'verde' | 'ambar' | 'rojo';
        metricas?: Record<string, number>;
    }>;
}

// Mantenemos el semáforo interno con 'amarillo' porque toda la UI del mobile
// ya está construida sobre ese vocabulario. Mapeamos 'ambar' → 'amarillo' aquí.
const COLOR_TO_NIVEL: Record<string, 'bajo' | 'medio' | 'alto'> = {
    verde: 'bajo',
    ambar: 'medio',
    amarillo: 'medio', // tolerancia por si el Motor vuelve al valor antiguo
    rojo: 'alto',
};
const COLOR_TO_SEMAFORO: Record<string, 'verde' | 'amarillo' | 'rojo'> = {
    verde: 'verde',
    ambar: 'amarillo',
    amarillo: 'amarillo',
    rojo: 'rojo',
};

// Etiquetas legibles por metric_id (evita que la UI muestre "hrv_ms" crudo).
const METRIC_LABELS: Record<string, string> = {
    hrv_ms: 'Variabilidad cardíaca (HRV)',
    fc_reposo: 'Frecuencia cardíaca en reposo',
    horas_sueno: 'Horas de sueño',
    spo2: 'Saturación de oxígeno',
};

// Unidades para mostrar junto al valor numérico en la UI.
const METRIC_UNITS: Record<string, string> = {
    horas_sueno: 'h',
    spo2: '%',
};

// El Motor puede devolver metricas[key] como número (caso normal) o como objeto
// anidado {valor: N, ...} (caso visto en producción con horas_sueno). String(objeto)
// produce "[object Object]". Este helper extrae siempre un string legible.
function safeMetricValue(key: string, raw: unknown): string {
    if (raw == null) return 'Sin datos';
    if (typeof raw === 'string') return raw; // ya tiene formato
    let num: number | null = null;
    if (typeof raw === 'number') {
        num = raw;
    } else if (typeof raw === 'object') {
        const o = raw as Record<string, unknown>;
        const inner = o.valor ?? o.value ?? o.horas ?? o.ms;
        if (typeof inner === 'number') num = inner;
        else if (typeof inner === 'string') return inner;
    }
    if (num == null) return 'Sin datos';
    const unit = METRIC_UNITS[key] ?? '';
    return `${num}${unit}`;
}

// Umbrales de desviación vs baseline para asignar severidad por señal.
// Métricas donde subir el valor es MEJOR (HRV, sueño, SpO2): rojo cuando ≤ 70 %
// del baseline; amarillo cuando ≤ 85 %. FC reposo es al revés (más alto = peor).
function computeSeverity(metricId: string, value: number, baseline?: number):
    'ok' | 'warning' | 'critical' {
    if (baseline == null || baseline === 0) return 'ok';
    const ratio = value / baseline;
    if (metricId === 'fc_reposo') {
        if (ratio >= 1.15) return 'critical';
        if (ratio >= 1.05) return 'warning';
        return 'ok';
    }
    if (ratio <= 0.70) return 'critical';
    if (ratio <= 0.85) return 'warning';
    return 'ok';
}

export interface MotorFatigueStatus {
    nivel: 'bajo' | 'medio' | 'alto';
    semaforo: 'verde' | 'amarillo' | 'rojo';
    ts?: string;
}

export interface MotorFatigueAlert {
    id: string;
    tipo: string;
    mensaje: string;
    ts: string;
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
        const body: Record<string, unknown> = {
            user_id: input.userId ?? 'opox-backend',
            ts: input.fecha,
        };
        // Body validado contra el schema real BiometriaIn: user_id + al menos
        // uno de {hrv_ms, fc_reposo, horas_sueno}. `spo2` NO está en el schema
        // — enviarlo puede provocar 422 en modo strict; el mobile lo usa en
        // el fallback local del HealthController.
        if (input.hrv != null) body.hrv_ms = input.hrv;
        if (input.fc_reposo != null) body.fc_reposo = input.fc_reposo;
        if (input.sueno_horas != null) body.horas_sueno = input.sueno_horas;

        const { data } = await this.http.post<MotorFatiguaApiResponse>('/v1/fatigue/biometrics', body);

        // Map Motor color-based nivel to OPOX bajo/medio/alto
        const nivel = COLOR_TO_NIVEL[data.nivel] ?? 'bajo';
        const semaforo = COLOR_TO_SEMAFORO[data.nivel] ?? 'verde';

        // Construimos las señales a partir de `metricas` (Record<string, number>).
        // La severidad por señal se deriva comparando contra `baseline` — el Motor
        // no expone severidad por métrica, solo un `nivel` global.
        const metricas = data.metricas ?? {};
        const baseline = data.baseline ?? {};
        const senales: MotorFatigueSignal[] = Object.entries(metricas).map(([key, value]) => {
            // Convención del Motor: baselines suelen exponerse con sufijo `_promedio`.
            const baseValue = baseline[key] ?? baseline[`${key}_promedio`];
            const severidad = typeof value === 'number'
                ? computeSeverity(key, value, typeof baseValue === 'number' ? baseValue : undefined)
                : 'ok';
            return {
                id: key,
                label: METRIC_LABELS[key] ?? key.replace(/_/g, ' '),
                valor: safeMetricValue(key, value),
                estado: severidad === 'critical' ? 'alerta' : 'ok',
                severidad,
            };
        });

        const historial_7_dias = (data.historico ?? []).slice(0, 7).map((h) => ({
            fecha: typeof h.fecha === 'string' ? (h.fecha.split('T')[0] ?? h.fecha) : String(h.fecha ?? ''),
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

    /** GET /v1/fatigue/status?user_id= — estado de fatiga actual del usuario. */
    async getStatus(userId: string): Promise<MotorFatigueStatus> {
        const { data } = await this.http.get<Record<string, unknown>>(
            `/v1/fatigue/status?user_id=${encodeURIComponent(userId)}`,
        );
        const nivel = COLOR_TO_NIVEL[String(data.nivel ?? 'verde')] ?? 'bajo';
        const semaforo = COLOR_TO_SEMAFORO[String(data.nivel ?? 'verde')] ?? 'verde';
        return { nivel, semaforo, ts: data.ts ? String(data.ts) : undefined };
    }

    /** GET /v1/fatigue/alerts?user_id= — alertas de fatiga activas del usuario. */
    async getAlerts(userId: string): Promise<MotorFatigueAlert[]> {
        const { data } = await this.http.get<unknown>(
            `/v1/fatigue/alerts?user_id=${encodeURIComponent(userId)}`,
        );
        const list = Array.isArray(data) ? data : [];
        return list.map((raw) => {
            const a = raw as Record<string, unknown>;
            return {
                id: String(a.id ?? ''),
                tipo: String(a.tipo ?? ''),
                mensaje: String(a.mensaje ?? ''),
                ts: String(a.ts ?? ''),
            };
        });
    }
}
