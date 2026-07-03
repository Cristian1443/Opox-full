import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../../domain';
import { logger } from '@opox/utils';
import type { ApiErrorResponse } from '@opox/types';

/**
 * Middleware global de errores. TODAS las rutas deben usar next(err)
 * para propagar aquí. Traduce cualquier error a ApiErrorResponse
 * con code + status + mensaje.
 */
export function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
): void {
    // Errores de dominio → status y code propios
    if (err instanceof DomainError) {
        const body: ApiErrorResponse = {
            ok: false,
            error: {
                code: err.code,
                message: err.message,
                ...(err.fields && { fields: err.fields }),
            },
        };
        res.status(err.httpStatus).json(body);
        return;
    }

    // Errores de validación (Zod)
    if (err instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of err.errors) {
            const path = issue.path.join('.');
            fields[path || '_'] = issue.message;
        }
        const body: ApiErrorResponse = {
            ok: false,
            error: {
                code: 'validation/failed',
                message: 'Datos inválidos.',
                fields,
            },
        };
        res.status(400).json(body);
        return;
    }

    // Cualquier otra cosa → 500 y logueamos con contexto para investigar.
    // Extraemos cause anidado (útil para errores de fetch tipo undici).
    const errorMeta: Record<string, unknown> = {
        path: req.path,
        method: req.method,
    };
    if (err instanceof Error) {
        errorMeta['name'] = err.name;
        errorMeta['message'] = err.message;
        errorMeta['stack'] = err.stack;
        const errWithProps = err as Error & { cause?: unknown; code?: string; status?: number };
        if (errWithProps.cause) {
            const cause = errWithProps.cause as Error & { code?: string; errno?: number };
            errorMeta['cause'] = {
                name: cause?.name,
                message: cause?.message,
                code: cause?.code,
                errno: cause?.errno,
            };
        }
        if (errWithProps.code) errorMeta['code'] = errWithProps.code;
        if (errWithProps.status) errorMeta['status'] = errWithProps.status;
    } else {
        errorMeta['raw'] = String(err);
    }
    logger.error('[unhandled]', errorMeta);

    const body: ApiErrorResponse = {
        ok: false,
        error: {
            code: 'common/internal-error',
            message: 'Error interno del servidor.',
        },
    };
    res.status(500).json(body);
}
