import type { Request, Response, NextFunction } from 'express';
import type { ApiSuccessResponse } from '@opox/types';
import type { GetDevicesUseCase, RegisterDeviceUseCase, DeleteDeviceUseCase } from '../../application';
import type { UserDevice } from '../../domain/entities';
import type { MotorFatigueClient } from '../../infrastructure/clients/MotorFatigueClient';

function ok<T>(res: Response, status: number, data: T): void {
    res.status(status).json({ ok: true, data } satisfies ApiSuccessResponse<T>);
}

interface HealthControllerDeps {
    getDevices: GetDevicesUseCase;
    registerDevice: RegisterDeviceUseCase;
    deleteDevice: DeleteDeviceUseCase;
    motorFatigue?: MotorFatigueClient;
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

    analyzeFatigue = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const { hrv, fc_reposo, sueno_horas } = req.body as {
            hrv?: number | null;
            fc_reposo?: number | null;
            sueno_horas?: number | null;
        };
        const fecha = new Date().toLocaleDateString('sv');

        // Intentar Motor si está configurado; ante cualquier fallo, caer al
        // cálculo local para no exponer 500 al mobile.
        if (this.deps.motorFatigue) {
            try {
                const result = await this.deps.motorFatigue.analyze({ hrv, fc_reposo, sueno_horas, fecha });
                ok(res, 200, result);
                return;
            } catch {
                // fallthrough al cálculo local
            }
        }
        ok(res, 200, buildFatigueLocally({ hrv, fc_reposo, sueno_horas, fecha }));
    };
}

// Fallback local — misma forma que MotorFatigueResult, heurística ligera
// derivada de HRV / FC reposo / horas de sueño. Sirve cuando el Motor no
// está configurado o falla (timeout, 404, offline).
function buildFatigueLocally(input: {
    hrv?: number | null;
    fc_reposo?: number | null;
    sueno_horas?: number | null;
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

    const sleep = input.sueno_horas;
    senales.push({
        id: 'sueno',
        label: 'Sueño noche anterior',
        valor: sleep != null ? `${sleep}h` : 'Sin datos',
        estado: sleep == null ? 'desconocido' : sleep >= 7 ? 'ok' : 'alerta',
        severidad: sleep == null ? 'unknown' : sleep >= 7 ? 'ok' : sleep >= 5.5 ? 'warning' : 'critical',
    });

    // Nivel según severidades
    const critical = senales.filter((s) => s.severidad === 'critical').length;
    const warning  = senales.filter((s) => s.severidad === 'warning').length;
    const nivel: 'bajo' | 'medio' | 'alto' =
        critical >= 2 ? 'alto' : (critical === 1 || warning >= 2 ? 'medio' : 'bajo');
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
