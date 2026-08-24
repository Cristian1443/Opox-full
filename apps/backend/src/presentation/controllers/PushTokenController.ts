import type { Request, Response, NextFunction } from 'express';
import type { RegisterPushTokenUseCase } from '../../application/notifications/NotificationUseCases';
import type { ApiSuccessResponse } from '@opox/types';

function ok<T>(res: Response, status: number, data: T): void {
    res.status(status).json({ ok: true, data } satisfies ApiSuccessResponse<T>);
}

export class PushTokenController {
    constructor(
        private readonly deps: {
            registerToken: RegisterPushTokenUseCase;
        },
    ) {}

    // POST /push/token
    registerToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { token, platform, deviceId } = req.body as {
                token: string;
                platform: 'ios' | 'android';
                deviceId: string;
            };
            const result = await this.deps.registerToken.execute({
                userId: req.authUser!.id,
                token,
                platform,
                deviceId,
            });
            ok(res, 200, result);
        } catch (e) { next(e); }
    };
}
