import { Router } from 'express';
import { API_ROUTES } from '@opox/constants';
import { HealthController } from '../controllers';

export function createHealthRouter(): Router {
    const router = Router();
    const controller = new HealthController();
    router.get(API_ROUTES.HEALTH, (req, res) => controller.check(req, res));
    return router;
}
