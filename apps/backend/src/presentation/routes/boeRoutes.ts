import { Router, type RequestHandler } from 'express';
import { API_ROUTES } from '@opox/constants';
import type { BoeController } from '../controllers/BoeController';
import { validateBody } from '../middleware/validate';
import { completeMiniTestBody } from '../validators/boeValidators';

export function createBoeRouter(
    controller: BoeController,
    authMiddleware: RequestHandler,
): Router {
    const r = Router();
    const B = API_ROUTES.BOE;

    // Feed de cambios
    r.get(B.FEED, authMiddleware, controller.getFeed);

    // Detalle de un cambio
    r.get(B.CHANGE_DETAIL, authMiddleware, controller.getDetail);

    // Comparativa antes/después
    r.get(B.CHANGE_COMPARISON, authMiddleware, controller.getComparison);

    // Mini-test de validación
    r.get(B.CHANGE_MINI_TEST, authMiddleware, controller.getMiniTest);
    r.post(B.CHANGE_MINI_TEST_COMPLETE, authMiddleware, validateBody(completeMiniTestBody), controller.completeMiniTest);

    // Interacciones del usuario
    r.post(B.CHANGE_READ, authMiddleware, controller.markRead);
    r.post(B.CHANGE_BOOKMARK, authMiddleware, controller.toggleBookmark);

    return r;
}
