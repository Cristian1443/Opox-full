import { env } from './config';
import { createServer } from './server';
import { logger } from '@opox/utils';

const app = createServer();

const server = app.listen(env.PORT, () => {
    logger.info(`[server] escuchando en http://localhost:${env.PORT}`, {
        env: env.NODE_ENV,
    });
});

// Cierre limpio ante SIGTERM/SIGINT (Docker, kill, Ctrl+C)
const shutdown = (signal: string): void => {
    logger.info(`[server] recibida señal ${signal}, cerrando...`);
    server.close(() => {
        logger.info('[server] cerrado limpiamente');
        process.exit(0);
    });
    setTimeout(() => {
        logger.error('[server] shutdown forzado tras 10s');
        process.exit(1);
    }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
