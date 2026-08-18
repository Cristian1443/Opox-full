import { Router } from 'express';
import { API_ROUTES } from '@opox/constants';
import type { ConfigController } from '../controllers/ConfigController';
import { validateBody } from '../middleware/validate';
import {
    updatePreferencesBody,
    exportProStatsBody,
    submitFeedbackBody,
} from '../validators/configValidators';
import type { RequestHandler } from 'express';

export function createConfigRouter(
    controller: ConfigController,
    authMiddleware: RequestHandler,
): Router {
    const r = Router();
    const C = API_ROUTES.CONFIG;

    r.get(C.PREFERENCES,      authMiddleware, controller.getPreferences);
    r.patch(C.PREFERENCES,    authMiddleware, validateBody(updatePreferencesBody), controller.updatePreferences);
    r.get(C.PRO_STATS,        authMiddleware, controller.getProStats);
    r.post(C.PRO_STATS_EXPORT, authMiddleware, validateBody(exportProStatsBody), controller.exportProStats);
    r.post(C.FEEDBACK,        authMiddleware, validateBody(submitFeedbackBody), controller.submitFeedback);

    return r;
}
