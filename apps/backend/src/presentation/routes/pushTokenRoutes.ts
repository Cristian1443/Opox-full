import { Router } from 'express';
import { API_ROUTES } from '@opox/constants';
import type { PushTokenController } from '../controllers/PushTokenController';
import { validateBody } from '../middleware/validate';
import { registerPushTokenBody } from '../validators/pushTokenValidators';
import type { RequestHandler } from 'express';

export function createPushRouter(
    controller: PushTokenController,
    authMiddleware: RequestHandler,
): Router {
    const r = Router();
    const P = API_ROUTES.PUSH;

    r.post(P.REGISTER_TOKEN, authMiddleware, validateBody(registerPushTokenBody), controller.registerToken);

    return r;
}
