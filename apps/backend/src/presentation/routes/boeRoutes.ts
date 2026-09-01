import { Router, type RequestHandler } from 'express';
import { API_ROUTES } from '@opox/constants';
import type { BoeController } from '../controllers/BoeController';
import { validateBody } from '../middleware/validate';
import { completeMiniTestBody, followRegulationBody, syncChangesBody } from '../validators/boeValidators';

export function createBoeRouter(
    controller: BoeController,
    authMiddleware: RequestHandler,
): Router {
    const r = Router();
    const B = API_ROUTES.BOE;

    // Feed de cambios (10.1)
    r.get(B.FEED, authMiddleware, controller.getFeed);

    // Gestión de normas seguidas — el usuario gestiona qué normas monitoriza
    r.get(B.REGULATIONS, authMiddleware, controller.listRegulations);
    r.post(B.REGULATIONS, authMiddleware, validateBody(followRegulationBody), controller.followRegulation);
    r.delete(B.REGULATION, authMiddleware, controller.unfollowRegulation);

    // Catálogo BOE — buscar normas para seguir
    r.get(B.CATALOG_SEARCH, authMiddleware, controller.searchCatalog);
    r.post(B.CATALOG_SYNC, authMiddleware, controller.syncCatalog);

    // Detalle de un cambio (10.2)
    r.get(B.CHANGE_DETAIL, authMiddleware, controller.getDetail);

    // Comparativa antes/después (10.3)
    r.get(B.CHANGE_COMPARISON, authMiddleware, controller.getComparison);

    // Mini-test de validación (10.4)
    r.get(B.CHANGE_MINI_TEST, authMiddleware, controller.getMiniTest);
    r.post(B.CHANGE_MINI_TEST_COMPLETE, authMiddleware, validateBody(completeMiniTestBody), controller.completeMiniTest);

    // Interacciones del usuario
    r.post(B.CHANGE_READ, authMiddleware, controller.markRead);
    r.post(B.CHANGE_BOOKMARK, authMiddleware, controller.toggleBookmark);

    // Sincronización con Motor BOE (admin/cron)
    r.post(B.SYNC, authMiddleware, validateBody(syncChangesBody), controller.syncChanges);

    return r;
}
