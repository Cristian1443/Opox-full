import type { Request, Response, NextFunction } from 'express';
import type { ApiSuccessResponse } from '@opox/types';
import type {
    GetBoeFeedUseCase,
    GetBoeChangeDetailUseCase,
    GetBoeComparisonUseCase,
    GetBoeMiniTestUseCase,
    MarkBoeReadUseCase,
    ToggleBoeBookmarkUseCase,
    CompleteBoeMiniTestUseCase,
    SyncBoeChangesUseCase,
} from '../../application';

function ok<T>(res: Response, status: number, data: T): void {
    res.status(status).json({ ok: true, data } satisfies ApiSuccessResponse<T>);
}

export class BoeController {
    constructor(
        private readonly deps: {
            getFeed: GetBoeFeedUseCase;
            getDetail: GetBoeChangeDetailUseCase;
            getComparison: GetBoeComparisonUseCase;
            getMiniTest: GetBoeMiniTestUseCase;
            markRead: MarkBoeReadUseCase;
            toggleBookmark: ToggleBoeBookmarkUseCase;
            completeMiniTest: CompleteBoeMiniTestUseCase;
            syncChanges?: SyncBoeChangesUseCase;
        },
    ) {}

    // GET /boe/feed
    getFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.deps.getFeed.execute(req.authUser!.id);
            ok(res, 200, result);
        } catch (e) { next(e); }
    };

    // GET /boe/changes/:id
    getDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const changeId = req.params['id'] as string;
            const result = await this.deps.getDetail.execute(changeId, req.authUser!.id);
            ok(res, 200, result);
        } catch (e) { next(e); }
    };

    // GET /boe/changes/:id/comparison
    getComparison = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const changeId = req.params['id'] as string;
            const result = await this.deps.getComparison.execute(changeId);
            ok(res, 200, result);
        } catch (e) { next(e); }
    };

    // GET /boe/changes/:id/mini-test
    getMiniTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const changeId = req.params['id'] as string;
            const result = await this.deps.getMiniTest.execute(changeId, req.authUser!.id);
            ok(res, 200, result);
        } catch (e) { next(e); }
    };

    // POST /boe/changes/:id/read
    markRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const changeId = req.params['id'] as string;
            const result = await this.deps.markRead.execute(changeId, req.authUser!.id);
            ok(res, 200, result);
        } catch (e) { next(e); }
    };

    // POST /boe/changes/:id/bookmark
    toggleBookmark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const changeId = req.params['id'] as string;
            const result = await this.deps.toggleBookmark.execute(changeId, req.authUser!.id);
            ok(res, 200, result);
        } catch (e) { next(e); }
    };

    // POST /boe/changes/:id/mini-test/complete
    completeMiniTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const changeId = req.params['id'] as string;
            const { score, total } = req.body as { score: number; total: number };
            await this.deps.completeMiniTest.execute(changeId, req.authUser!.id, score, total);
            res.status(204).end();
        } catch (e) { next(e); }
    };

    // POST /boe/sync  — endpoint admin/cron para sincronizar cambios del Motor BOE
    syncChanges = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!this.deps.syncChanges) {
                res.status(503).json({ ok: false, error: 'Motor BOE no configurado (MOTOR_BOE_BASE_URL)' });
                return;
            }
            const { curso_id } = req.body as { curso_id: string };
            const result = await this.deps.syncChanges.execute(curso_id);
            ok(res, 200, result);
        } catch (e) { next(e); }
    };
}
