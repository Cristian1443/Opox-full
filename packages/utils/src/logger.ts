/**
 * Logger minimalista compartido.
 * En backend se puede sustituir por pino/winston sin cambiar la API.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

const minLevel: LogLevel = (process.env['LOG_LEVEL'] as LogLevel) || 'info';

const shouldLog = (level: LogLevel): boolean =>
    LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];

const log = (level: LogLevel, msg: string, meta?: Record<string, unknown>): void => {
    if (!shouldLog(level)) return;
    const entry = {
        ts: new Date().toISOString(),
        level,
        msg,
        ...(meta || {}),
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
};

export const logger = {
    debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
    info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
};
