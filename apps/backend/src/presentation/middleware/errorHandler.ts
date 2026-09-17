import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import axios from 'axios';
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

    // Errores de servicios upstream (Motor IA, otras APIs externas vía axios).
    // Traducimos el status real del upstream y devolvemos el detail cuando existe,
    // para que el mobile pueda mostrar mensajes útiles en lugar de "Error interno".
    if (axios.isAxiosError(err)) {
        const upstreamStatus = err.response?.status ?? 502;
        const detail = err.response?.data as { detail?: unknown; error?: unknown } | undefined;
        const rawMessage = typeof detail?.detail === 'string'
            ? detail.detail
            : typeof detail?.error === 'string'
                ? detail.error
                : Array.isArray(detail?.detail)
                    ? detail.detail.map((d: { msg?: string }) => d?.msg).filter(Boolean).join('; ')
                    : err.message;
        // Mapeamos a status HTTP nuestro: 4xx del upstream lo propagamos como 4xx
        // (bad request/validation), 5xx como 502 bad gateway (nuestro proxy falla).
        const propagatedStatus = upstreamStatus >= 400 && upstreamStatus < 500 ? upstreamStatus : 502;
        logger.warn('[upstream-error]', {
            path: req.path,
            method: req.method,
            upstreamStatus,
            url: err.config?.url,
            detail,
        });
        const body: ApiErrorResponse = {
            ok: false,
            error: {
                code: `upstream/${upstreamStatus}`,
                message: rawMessage || 'El servicio externo devolvió un error.',
            },
        };
        res.status(propagatedStatus).json(body);
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
    } else if (err && typeof err === 'object') {
        // Errores no-Error (ej. PostgrestError de Supabase): objetos planos.
        try {
            errorMeta['raw'] = JSON.stringify(err);
        } catch {
            errorMeta['raw'] = Object.keys(err as Record<string, unknown>).join(',');
        }
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
