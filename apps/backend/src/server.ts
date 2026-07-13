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
    errorHandler,
} from './presentation';

export function createServer(): Express {
    const app = express();
    const container = buildContainer();

    // Seguridad + body parser
    app.use(helmet());
    app.use(cors({ origin: corsOrigins, credentials: true }));
    // Límite de 5mb para soportar imágenes base64 del Foto-Test (6.3)
    app.use(express.json({ limit: '5mb' }));

    // Rutas
    app.use(createHealthRouter());
    app.use(createAuthRouter(container.controllers.auth, container.middleware.auth));
    app.use(createDashboardRouter(container.controllers.dashboard, container.middleware.auth));
    app.use(createPlanningRouter(container.controllers.planning, container.middleware.auth));
    app.use(createMotivationRouter(container.controllers.motivation, container.middleware.auth));
    app.use(createTrainingRouter(container.controllers.training, container.middleware.auth));

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
