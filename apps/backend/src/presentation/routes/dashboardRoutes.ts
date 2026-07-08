import { Router, type RequestHandler } from 'express';
import { API_ROUTES } from '@opox/constants';
import type { DashboardController } from '../controllers';
import { validateBody, validateQuery } from '../middleware';
import {
    listNotificationsQuerySchema,
    createNotificationSchema,
    registerActivitySchema,
} from '../validators';

/**
 * Todas las rutas del Bloque 2 requieren sesión — no hay vistas públicas del
 * dashboard. `authMiddleware` se pasa por ruta (no con `r.use(...)`): este
 * router se monta en la raíz igual que authRoutes/healthRoutes, y un
 * `r.use()` sin path ahí interceptaría cualquier request que llegue hasta
 * aquí — incluido el catch-all 404 de rutas que no existen en ningún router.
 */
export function createDashboardRouter(
    controller: DashboardController,
    authMiddleware: RequestHandler,
): Router {
    const r = Router();

    r.get(API_ROUTES.DASHBOARD.SUMMARY, authMiddleware, controller.getSummary);

    r.get(
        API_ROUTES.DASHBOARD.NOTIFICATIONS,
        authMiddleware,
        validateQuery(listNotificationsQuerySchema),
        controller.listNotifications,
    );
    r.post(
        API_ROUTES.DASHBOARD.NOTIFICATIONS,
        authMiddleware,
        validateBody(createNotificationSchema),
        controller.createNotification,
    );
    r.get(API_ROUTES.DASHBOARD.NEXT_NUDGE, authMiddleware, controller.getNextNudge);
    r.post(API_ROUTES.DASHBOARD.NOTIFICATION_READ, authMiddleware, controller.markNotificationRead);
    r.post(
        API_ROUTES.DASHBOARD.NOTIFICATIONS_READ_ALL,
        authMiddleware,
        controller.markAllNotificationsRead,
    );

    r.get(API_ROUTES.DASHBOARD.GAMIFICATION, authMiddleware, controller.getGamification);
    r.post(
        API_ROUTES.DASHBOARD.GAMIFICATION_ACTIVITY,
        authMiddleware,
        validateBody(registerActivitySchema),
        controller.registerActivity,
    );

    return r;
}
