import type { Request, Response, NextFunction } from 'express';
import type { ApiSuccessResponse } from '@opox/types';
import type { GetDevicesUseCase, RegisterDeviceUseCase, DeleteDeviceUseCase } from '../../application';
import type { UserDevice } from '../../domain/entities';

function ok<T>(res: Response, status: number, data: T): void {
    res.status(status).json({ ok: true, data } satisfies ApiSuccessResponse<T>);
}

interface HealthControllerDeps {
    getDevices: GetDevicesUseCase;
    registerDevice: RegisterDeviceUseCase;
    deleteDevice: DeleteDeviceUseCase;
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
