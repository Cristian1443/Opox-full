import type { Request, Response } from 'express';

export class HealthController {
    check(_req: Request, res: Response): void {
        res.json({
            status: 'ok',
            timestamp: new Date(),
        });
    }
}
