import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema } from 'zod';

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
