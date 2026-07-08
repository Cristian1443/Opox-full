import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

declare module 'express-serve-static-core' {
    interface Request {
        validatedQuery?: unknown;
    }
}

/**
 * Middleware factory: valida req.body contra un ZodSchema.
 * Si falla, propaga ZodError al errorHandler global.
 */
export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            next(result.error);
            return;
        }
        req.body = result.data;
        next();
    };
}

/**
 * Igual que validateBody pero sobre req.query (ej. filtros/paginación de
 * listados). Guarda el resultado parseado en `req.validatedQuery` en vez
 * de reescribir `req.query`, para no depender de que Express permita
 * reasignarlo.
 */
export function validateQuery<T>(schema: ZodSchema<T>): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            next(result.error);
            return;
        }
        req.validatedQuery = result.data;
        next();
    };
}
