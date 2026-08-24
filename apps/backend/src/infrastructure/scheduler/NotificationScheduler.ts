import * as cron from 'node-cron';
import { logger } from '@opox/utils';

type JobFn = () => Promise<unknown>;

/**
 * Cron de notificaciones push.
 * Todos los horarios en UTC. Colombia = UTC-5 (sin horario de verano).
 * 20:00 Colombia = 01:00 UTC del día siguiente.
 */
export class NotificationScheduler {
    private readonly tasks: ReturnType<typeof cron.schedule>[] = [];

    /** Registra el job de racha diaria y lo arranca. */
    registerStreakWarning(job: JobFn): this {
        // Cada día a las 01:00 UTC = 20:00 hora Colombia
        const task = cron.schedule('0 1 * * *', async () => {
            logger.info('[scheduler] streak-warning cron fired');
            try { await job(); }
            catch (err) { logger.error('[scheduler] streak-warning error', { err }); }
        }, { timezone: 'UTC' });

        this.tasks.push(task);
        logger.info('[scheduler] streak-warning registrado — cron: 0 1 * * * UTC (20:00 Colombia)');
        return this;
    }

    start(): void {
        this.tasks.forEach(t => t.start());
    }

    stop(): void {
        this.tasks.forEach(t => t.stop());
    }
}
