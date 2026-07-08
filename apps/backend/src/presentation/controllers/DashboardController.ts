import type { Request, Response, NextFunction } from 'express';
import type {
    ApiSuccessResponse,
    NotificationDTO,
    GamificationDTO,
    DashboardSummaryDTO,
    PaginatedResponse,
} from '@opox/types';
import type {
    GetDashboardSummaryUseCase,
    ListNotificationsUseCase,
    GetNextNudgeUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
    CreateNotificationUseCase,
    GetGamificationUseCase,
    RegisterActivityUseCase,
} from '../../application';
import type { Notification, UserGamification } from '../../domain';

/**
 * Controller del Bloque 2 · Dashboard. Mismo patrón que AuthController:
 * sin lógica de negocio, solo extrae → llama al use case → serializa.
 */
export class DashboardController {
    constructor(
        private readonly deps: {
            getSummary: GetDashboardSummaryUseCase;
            listNotifications: ListNotificationsUseCase;
            getNextNudge: GetNextNudgeUseCase;
            markNotificationRead: MarkNotificationReadUseCase;
            markAllNotificationsRead: MarkAllNotificationsReadUseCase;
            createNotification: CreateNotificationUseCase;
            getGamification: GetGamificationUseCase;
            registerActivity: RegisterActivityUseCase;
        },
    ) { }

    // ─── Helpers de serialización ─────────────────

    private serializeNotification(n: Notification): NotificationDTO {
        return {
            id: n.id,
            category: n.category,
            icon: n.icon,
            title: n.title,
            body: n.body,
            isNudge: n.isNudge,
            ...(n.nudgeKind && { nudgeKind: n.nudgeKind }),
            ...(n.primaryLabel && { primaryLabel: n.primaryLabel }),
            ...(n.secondaryLabel && { secondaryLabel: n.secondaryLabel }),
            ...(n.actionRoute && { actionRoute: n.actionRoute }),
            ...(n.readAt && { readAt: n.readAt.toISOString() }),
            createdAt: n.createdAt.toISOString(),
        };
    }

    private serializeGamification(g: UserGamification): GamificationDTO {
        return {
            currentStreak: g.currentStreak,
            longestStreak: g.longestStreak,
            opopointsBalance: g.opopointsBalance,
        };
    }

    private ok<T>(res: Response, status: number, data: T): void {
        const body: ApiSuccessResponse<T> = { ok: true, data };
        res.status(status).json(body);
    }

    // ─── Handlers ─────────────────────────────────

    getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const summary = await this.deps.getSummary.execute({
                userId: req.authUser!.id,
                accessToken: req.authUser!.accessToken,
            });
            const dto: DashboardSummaryDTO = {
                profile: summary.profile,
                gamification: summary.gamification,
                notifications: summary.notifications,
                nextNudge: summary.nextNudge ? this.serializeNotification(summary.nextNudge) : null,
                health: summary.health,
                plan: summary.plan,
                quickAccess: summary.quickAccess,
            };
            this.ok(res, 200, dto);
        } catch (err) { next(err); }
    };

    listNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const query = req.validatedQuery as {
                category?: 'boe' | 'social' | 'general';
                cursor?: string;
                limit?: number;
            };
            const result = await this.deps.listNotifications.execute({
                userId: req.authUser!.id,
                category: query.category,
                cursor: query.cursor ?? null,
                limit: query.limit,
            });
            const body: PaginatedResponse<NotificationDTO> = {
                items: result.items.map((n) => this.serializeNotification(n)),
                nextCursor: result.nextCursor,
            };
            this.ok(res, 200, body);
        } catch (err) { next(err); }
    };

    getNextNudge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const nudge = await this.deps.getNextNudge.execute(req.authUser!.id);
            this.ok(res, 200, nudge ? this.serializeNotification(nudge) : null);
        } catch (err) { next(err); }
    };

    markNotificationRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const notification = await this.deps.markNotificationRead.execute({
                userId: req.authUser!.id,
                notificationId: req.params['id'] as string,
            });
            this.ok(res, 200, this.serializeNotification(notification));
        } catch (err) { next(err); }
    };

    markAllNotificationsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.deps.markAllNotificationsRead.execute(req.authUser!.id);
            this.ok(res, 200, result);
        } catch (err) { next(err); }
    };

    createNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const notification = await this.deps.createNotification.execute({
                userId: req.authUser!.id,
                ...req.body,
            });
            this.ok(res, 201, this.serializeNotification(notification));
        } catch (err) { next(err); }
    };

    getGamification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const gamification = await this.deps.getGamification.execute(req.authUser!.id);
            this.ok(res, 200, this.serializeGamification(gamification));
        } catch (err) { next(err); }
    };

    registerActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const gamification = await this.deps.registerActivity.execute({
                userId: req.authUser!.id,
                reason: req.body.reason,
                points: req.body.points,
            });
            this.ok(res, 200, this.serializeGamification(gamification));
        } catch (err) { next(err); }
    };
}
