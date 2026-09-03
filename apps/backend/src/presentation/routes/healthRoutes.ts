import { Router } from 'express';
import { API_ROUTES } from '@opox/constants';
import type { HealthController } from '../controllers';
import type { RequestHandler } from 'express';

export function createHealthRouter(
    controller?: HealthController,
    authMiddleware?: RequestHandler,
): Router {
    const router = Router();
    router.get(API_ROUTES.HEALTH, (req, res) => controller
        ? controller.check(req, res)
        : res.json({ status: 'ok', timestamp: new Date() }),
    );

    if (controller && authMiddleware) {
        router.get(API_ROUTES.HEALTH_DEVICES, authMiddleware, controller.listDevices);
        router.post(API_ROUTES.HEALTH_DEVICES, authMiddleware, controller.addDevice);
        router.delete(API_ROUTES.HEALTH_DEVICE, authMiddleware, controller.removeDevice);
        router.post(API_ROUTES.HEALTH_FATIGUE, authMiddleware, controller.analyzeFatigue);
    }

    return router;
}
