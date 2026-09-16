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

    /**
     * Sincronización periódica del `course_id` del Motor con `training_courses`
     * en Supabase (Fase 4 · gaps-15-09-26). Cada re-ingesta del Motor genera un
     * ID nuevo — sin este job hay que actualizar la tabla a mano cada vez.
     */
    registerCourseSync(job: JobFn): this {
        // Cada 30 minutos, todos los días.
        const task = cron.schedule('*/30 * * * *', async () => {
            try { await job(); }
            catch (err) { logger.error('[scheduler] course-sync error', { err }); }
        }, { timezone: 'UTC' });

        this.tasks.push(task);
        logger.info('[scheduler] course-sync registrado — cron: */30 * * * * UTC');
        return this;
    }

    start(): void {
        this.tasks.forEach(t => t.start());
    }

    stop(): void {
        this.tasks.forEach(t => t.stop());
    }
}
