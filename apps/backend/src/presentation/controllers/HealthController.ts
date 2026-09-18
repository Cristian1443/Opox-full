import type { Request, Response, NextFunction } from 'express';
import type { ApiSuccessResponse } from '@opox/types';
import type {
    GetDevicesUseCase,
    RegisterDeviceUseCase,
    DeleteDeviceUseCase,
    SaveDailyCheckinUseCase,
    GetDailyCheckinUseCase,
} from '../../application';
import type { UserDevice, DailyCheckin, EnergyLevel, CheckinFactor } from '../../domain/entities';
import { ALL_CHECKIN_FACTORS } from '../../domain/entities';
import type { MotorFatigueClient } from '../../infrastructure/clients/MotorFatigueClient';
import type { HealthAiClient } from '../../infrastructure/clients/HealthAiClient';

function ok<T>(res: Response, status: number, data: T): void {
    res.status(status).json({ ok: true, data } satisfies ApiSuccessResponse<T>);
}

function badRequest(res: Response, message: string): void {
    res.status(400).json({ ok: false, error: { code: 'common/bad-request', message } });
}

interface HealthControllerDeps {
    getDevices: GetDevicesUseCase;
    registerDevice: RegisterDeviceUseCase;
    deleteDevice: DeleteDeviceUseCase;
    saveCheckin: SaveDailyCheckinUseCase;
    getCheckin: GetDailyCheckinUseCase;
    motorFatigue?: MotorFatigueClient;
    healthAi?: HealthAiClient;
}

export class HealthController {
    constructor(private readonly deps: HealthControllerDeps) {}

    check(_req: Request, res: Response): void {
        res.json({ status: 'ok', timestamp: new Date() });
    }

    listDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const devices = await this.deps.getDevices.execute(req.authUser!.id);
            ok(res, 200, devices.map(serializeDevice));
        } catch (err) { next(err); }
    };

    addDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { deviceName, platform, icon = 'watch-outline' } = req.body as {
                deviceName: string;
                platform: string;
                icon?: string;
            };
            const device = await this.deps.registerDevice.execute({
                userId: req.authUser!.id,
                deviceName,
                platform,
                icon,
            });
            ok(res, 201, serializeDevice(device));
        } catch (err) { next(err); }
    };

    removeDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.deps.deleteDevice.execute(req.params.deviceId as string, req.authUser!.id);
            ok(res, 200, null);
        } catch (err) { next(err); }
    };

    // ─── Check-in diario ─────────────────────────────────────────────────────
    // Fuente primaria de señales del bloque Salud cuando no hay wearable.
    // Upsert idempotente por (user_id, local_date).
    saveCheckin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = req.body as {
                localDate?: string;
                moodScore?: number;
                sleepHours?: number;
                energyLevel?: EnergyLevel;
                factors?: string[];
            };

            const localDate = String(body.localDate ?? '').trim();
            const moodScore = Number(body.moodScore);
            const sleepHours = Number(body.sleepHours);
            const energyLevel = body.energyLevel;
            const factors = Array.isArray(body.factors) ? body.factors : [];

            if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
                return badRequest(res, 'localDate debe tener formato YYYY-MM-DD');
            }
            if (!Number.isFinite(moodScore) || moodScore < 1 || moodScore > 10) {
                return badRequest(res, 'moodScore debe ser 1-10');
            }
            if (!Number.isFinite(sleepHours) || sleepHours < 0 || sleepHours > 24) {
                return badRequest(res, 'sleepHours debe ser 0-24');
            }
            if (!energyLevel || !['low','medium','high'].includes(energyLevel)) {
                return badRequest(res, 'energyLevel debe ser low|medium|high');
            }
            const validFactors = new Set(ALL_CHECKIN_FACTORS as string[]);
            const cleanFactors = factors.filter((f) => typeof f === 'string' && validFactors.has(f)) as CheckinFactor[];

            const result = await this.deps.saveCheckin.execute({
                userId: req.authUser!.id,
                localDate,
                moodScore,
                sleepHours,
                energyLevel,
                factors: cleanFactors,
            });

            ok(res, result.created ? 201 : 200, {
                checkin: serializeCheckin(result.checkin),
                created: result.created,
            });
        } catch (err) { next(err); }
    };

    getCheckin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const rawDate = String(req.query.localDate ?? '').trim();
            const localDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
                ? rawDate
                : new Date().toLocaleDateString('sv'); // fallback = hoy en TZ del server

            const checkin = await this.deps.getCheckin.execute(req.authUser!.id, localDate);
            if (!checkin) {
                res.status(404).json({
                    ok: false,
                    error: { code: 'health/checkin-not-found', message: 'No hay Estado del día registrado para esa fecha' },
                });
                return;
            }
            ok(res, 200, { checkin: serializeCheckin(checkin) });
        } catch (err) { next(err); }
    };

    analyzeFatigue = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const { hrv, fc_reposo, spo2, sueno_horas, moodScore, perceivedEnergy, factors } = req.body as {
            hrv?: number | null;
            fc_reposo?: number | null;
            spo2?: number | null;
            sueno_horas?: number | null;
            moodScore?: number | null;
            perceivedEnergy?: EnergyLevel | null;
            factors?: string[] | null;
        };
        const fecha = new Date().toLocaleDateString('sv');
        const userId = req.authUser!.id;

        // El Motor externo solo entiende métricas de wearable puras (HRV, HR
        // reposo, SpO₂). Sueño NO cuenta como biométrica porque también puede
        // venir del check-in — si lo incluimos, un usuario que solo llenó su
        // check-in dispararía el Motor con `sueno_horas=8h` y ninguna otra
        // métrica, y el Motor devolvería "Fatiga baja" con una sola señal.
        // Cuando solo hay check-in (con o sin sueño) el fallback local es la
        // ruta correcta porque sabe interpretar mood/energía/factores.
        const hasWearableBiometric = hrv != null || fc_reposo != null || spo2 != null;
        const hasCheckin = moodScore != null || perceivedEnergy != null || (Array.isArray(factors) && factors.length > 0);
        const hasAnyInput = hasWearableBiometric || hasCheckin || sueno_horas != null;

        if (this.deps.motorFatigue && hasWearableBiometric) {
            try {
                const result = await this.deps.motorFatigue.analyze({ userId, hrv, fc_reposo, spo2, sueno_horas, fecha });
                ok(res, 200, result);
                return;
            } catch {
                // fallthrough al cálculo local
            }
        }

        // Sin ninguna señal → devolver estado "sin datos" en vez de mentir con
        // "Fatiga baja" (que es lo que devolvía la heurística con todo null).
        if (!hasAnyInput) {
            ok(res, 200, {
                nivel: 'bajo',
                semaforo: 'verde',
                senales: [],
                recomendaciones: ['Guarda tu Estado del día o conecta un wearable para un diagnóstico real.'],
                historial_7_dias: [{ fecha, nivel: 'bajo' }],
                sin_datos: true,
            });
            return;
        }

        ok(res, 200, buildFatigueLocally({
            hrv, fc_reposo, spo2, sueno_horas,
            moodScore, perceivedEnergy,
            factors: Array.isArray(factors) ? factors : null,
            fecha,
        }));
    };

    generateMenus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!this.deps.healthAi) {
                ok(res, 200, { menus: [] });
                return;
            }
            const { objetivo = 'concentracion', fatigueLevel = 'bajo', restrictions = [], count = 1 } = req.body as {
                objetivo?: string;
                fatigueLevel?: string;
                restrictions?: string[];
                count?: number;
            };
            const result = await this.deps.healthAi.generateMenus({ objetivo, fatigueLevel, restrictions, count });
            ok(res, 200, result);
        } catch (err) { next(err); }
    };

    generateMeditation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!this.deps.healthAi) {
                ok(res, 200, { titulo: '', subtitulo: '', fases: [] });
                return;
            }
            const { tipo = 'focus', duracion = 5, fatigueLevel = 'bajo', diasHastaExamen } = req.body as {
                tipo?: string;
                duracion?: number;
                fatigueLevel?: string;
                diasHastaExamen?: number | null;
            };
            const result = await this.deps.healthAi.generateMeditation({ tipo, duracion, fatigueLevel, diasHastaExamen });
            ok(res, 200, result);
        } catch (err) { next(err); }
    };

    recommendStudyTechnique = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!this.deps.healthAi) {
                ok(res, 200, { tecnica: '', porque: '', adaptacion: '', tema_sugerido: null });
                return;
            }
            const { fatigueLevel = 'bajo', fatigueType, diasHastaExamen, ultimoTema, tiempoDisponible } = req.body as {
                fatigueLevel?: string;
                fatigueType?: string | null;
                diasHastaExamen?: number | null;
                ultimoTema?: string | null;
                tiempoDisponible?: number | null;
            };
            const result = await this.deps.healthAi.recommendStudyTechnique({ fatigueLevel, fatigueType, diasHastaExamen, ultimoTema, tiempoDisponible });
            ok(res, 200, result);
        } catch (err) { next(err); }
    };
}

// Fallback local — misma forma que MotorFatigueResult, heurística ligera que
// ahora incorpora señales manuales del check-in (mood, energía percibida,
// factores) además de HRV / FC reposo / horas de sueño. Sirve cuando el Motor
// no está configurado o falla (timeout, 404, offline) y también como respaldo
// primario para usuarios sin wearable — todas las entradas son opcionales.
function buildFatigueLocally(input: {
    hrv?: number | null;
    fc_reposo?: number | null;
    spo2?: number | null;
    sueno_horas?: number | null;
    moodScore?: number | null;
    perceivedEnergy?: EnergyLevel | null;
    factors?: string[] | null;
    fecha: string;
}) {
    const HRV_BASE = 50;
    const HR_BASE  = 61;
    const senales: Array<{
        id: string; label: string; nota?: string; valor: string;
        estado: 'ok' | 'alerta' | 'desconocido';
        severidad: 'ok' | 'warning' | 'critical' | 'unknown';
    }> = [];

    const hrv = input.hrv;
    senales.push({
        id: 'hrv',
        label: 'HRV por debajo de tu base',
        nota: 'Señal principal',
        valor: hrv != null ? `${hrv}/${HRV_BASE}` : 'Sin datos',
        estado: hrv == null ? 'desconocido' : hrv < HRV_BASE ? 'alerta' : 'ok',
        severidad: hrv == null ? 'unknown' : hrv < HRV_BASE * 0.8 ? 'critical' : hrv < HRV_BASE ? 'warning' : 'ok',
    });

    const hr = input.fc_reposo;
    senales.push({
        id: 'fc_reposo',
        label: 'FC reposo elevada',
        nota: 'Cuerpo no recuperado',
        valor: hr != null ? `${hr > HR_BASE ? '+' : ''}${hr - HR_BASE}` : 'Sin datos',
        estado: hr == null ? 'desconocido' : hr > HR_BASE ? 'alerta' : 'ok',
        severidad: hr == null ? 'unknown' : hr > HR_BASE + 6 ? 'critical' : hr > HR_BASE ? 'warning' : 'ok',
    });

    const spo2 = input.spo2;
    senales.push({
        id: 'spo2',
        label: 'Saturación de oxígeno',
        nota: 'Rendimiento aeróbico',
        valor: spo2 != null ? `${spo2}%` : 'Sin datos',
        estado: spo2 == null ? 'desconocido' : spo2 >= 95 ? 'ok' : 'alerta',
        severidad: spo2 == null ? 'unknown' : spo2 >= 95 ? 'ok' : 'warning',
    });

    const sleep = input.sueno_horas;
    senales.push({
        id: 'sueno',
        label: 'Sueño noche anterior',
        valor: sleep != null ? `${sleep}h` : 'Sin datos',
        estado: sleep == null ? 'desconocido' : sleep >= 7 ? 'ok' : 'alerta',
        severidad: sleep == null ? 'unknown' : sleep >= 7 ? 'ok' : sleep >= 5.5 ? 'warning' : 'critical',
    });

    // Señal derivada del check-in (opcional).
    const mood = input.moodScore;
    if (mood != null) {
        senales.push({
            id: 'mood',
            label: 'Cómo te sientes hoy',
            nota: 'De tu Estado del día',
            valor: `${mood}/10`,
            estado: mood <= 4 ? 'alerta' : 'ok',
            severidad: mood <= 3 ? 'critical' : mood <= 5 ? 'warning' : 'ok',
        });
    }

    // Factores auto-declarados que empeoran el estado (opcional).
    const factors = input.factors ?? [];
    const negativeFactors = factors.filter((f) =>
        ['estres','mala_noche','ansiedad_examen','dolor_cabeza','vista_cansada','digestion'].includes(f)
    );
    if (negativeFactors.length > 0) {
        senales.push({
            id: 'factores',
            label: 'Factores que restan hoy',
            valor: `${negativeFactors.length} activo${negativeFactors.length === 1 ? '' : 's'}`,
            estado: 'alerta',
            severidad: negativeFactors.length >= 3 ? 'critical' : negativeFactors.length >= 2 ? 'warning' : 'ok',
        });
    }

    // Nivel combinado — cuenta severidades. Con el mood integrado, un usuario
    // sin wearable pero con check-in ya obtiene una lectura útil.
    const critical = senales.filter((s) => s.severidad === 'critical').length;
    const warning  = senales.filter((s) => s.severidad === 'warning').length;

    // Energía percibida por el usuario es un fuerte overrider: si dice "baja"
    // subimos el nivel; si dice "alta" y no hay señales críticas, lo bajamos.
    let nivel: 'bajo' | 'medio' | 'alto' =
        critical >= 2 ? 'alto' : (critical === 1 || warning >= 2 ? 'medio' : 'bajo');

    if (input.perceivedEnergy === 'low' && nivel === 'bajo') nivel = 'medio';
    if (input.perceivedEnergy === 'low' && nivel === 'medio' && critical >= 1) nivel = 'alto';
    if (input.perceivedEnergy === 'high' && nivel === 'medio' && critical === 0) nivel = 'bajo';

    const semaforo: 'verde' | 'amarillo' | 'rojo' =
        nivel === 'alto' ? 'rojo' : nivel === 'medio' ? 'amarillo' : 'verde';

    const recomendaciones =
        nivel === 'alto'
            ? ['Descansa hoy: sesión corta o pausa.', 'Duerme al menos 7h esta noche.']
            : nivel === 'medio'
                ? ['Reduce intensidad hoy.', 'Añade una pausa de respiración cada 30 min.']
                : ['Continúa con tu plan.', 'Mantén hábitos de descanso.'];

    return {
        nivel,
        semaforo,
        senales,
        recomendaciones,
        historial_7_dias: [{ fecha: input.fecha, nivel }],
    };
}

function serializeDevice(device: UserDevice) {
    return {
        id:          device.id,
        deviceName:  device.deviceName,
        platform:    device.platform,
        icon:        device.icon,
        connectedAt: device.connectedAt.toISOString(),
    };
}

function serializeCheckin(c: DailyCheckin) {
    return {
        id:           c.id,
        userId:       c.userId,
        localDate:    c.localDate,
        moodScore:    c.moodScore,
        sleepHours:   c.sleepHours,
        energyLevel:  c.energyLevel,
        factors:      c.factors,
        createdAt:    c.createdAt.toISOString(),
    };
}
