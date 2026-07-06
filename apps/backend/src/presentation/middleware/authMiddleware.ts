import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../domain';
import type { GetSessionUseCase } from '../../application';

/**
 * Extiende Request con `authUser` tras verificar el JWT.
 * Cualquier ruta protegida usa este middleware antes del controller.
 */
declare module 'express-serve-static-core' {
    interface Request {
        authUser?: {
            id: string;
            email: string;
            accessToken: string;
        };
    }
}

export function createAuthMiddleware(getSession: GetSessionUseCase) {
    return async function authMiddleware(
        req: Request,
        _res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const header = req.headers.authorization;
            if (!header?.startsWith('Bearer ')) {
                throw new UnauthorizedError();
            }
            const token = header.slice(7).trim();
            if (!token) throw new UnauthorizedError();

            const session = await getSession.execute(token);
            req.authUser = {
                id: session.user.id,
                email: session.user.email,
                accessToken: token,
            };
            next();
        } catch (err) {
            next(err);
        }
    };
}
