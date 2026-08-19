import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOrigins } from './config';
import { buildContainer } from './container';
import {
    createHealthRouter,
    createAuthRouter,
    createDashboardRouter,
    createPlanningRouter,
    createMotivationRouter,
    createTrainingRouter,
    createTutorRouter,
    createNotesRouter,
    createBoeRouter,
    createStoreRouter,
    createConfigRouter,
    createPushRouter,
    errorHandler,
} from './presentation';
import { NotificationScheduler } from './infrastructure';

export function createServer(): Express {
    const app = express();
    const container = buildContainer();

    // Seguridad + body parser
    app.use(helmet());
    app.use(cors({ origin: corsOrigins, credentials: true }));
    // Límite subido a 25mb para soportar subida multi-página del Bloque 9
    // (Foto-Test del Bloque 6 sigue funcionando por el mismo límite).
    app.use(express.json({ limit: '25mb' }));

    // Rutas
    app.use(createHealthRouter());
    app.use(createAuthRouter(container.controllers.auth, container.middleware.auth));
    app.use(createDashboardRouter(container.controllers.dashboard, container.middleware.auth));
    app.use(createPlanningRouter(container.controllers.planning, container.middleware.auth));
    app.use(createMotivationRouter(container.controllers.motivation, container.middleware.auth));
    app.use(createTrainingRouter(container.controllers.training, container.middleware.auth));
    app.use(createTutorRouter(container.controllers.tutor, container.middleware.auth));
    app.use(createNotesRouter(container.controllers.notes, container.middleware.auth));
    app.use(createBoeRouter(container.controllers.boe, container.middleware.auth));
    app.use(createStoreRouter(container.controllers.store, container.middleware.auth));
    app.use(createConfigRouter(container.controllers.config, container.middleware.auth));
    app.use(createPushRouter(container.controllers.push, container.middleware.auth));

    // Cron de notificaciones (racha diaria a las 20:00h Colombia = 01:00 UTC)
    const scheduler = new NotificationScheduler();
    scheduler
        .registerStreakWarning(() => container.useCases.sendStreakWarning.execute())
        .start();

    // 404 catch-all
    app.use((_req, res) => {
        res.status(404).json({
            ok: false,
            error: { code: 'common/not-found', message: 'Ruta no encontrada.' },
        });
    });

    // Error handler global — SIEMPRE al final
    app.use(errorHandler);

    return app;
}
