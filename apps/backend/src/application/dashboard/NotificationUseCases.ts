import type { IDashboardRepository } from '../../domain';
import type { Notification, NotificationCategory } from '../../domain';

const DEFAULT_PAGE_SIZE = 20;

export class ListNotificationsUseCase {
    constructor(private readonly dashboardRepo: IDashboardRepository) { }

    execute(input: {
        userId: string;
        category?: NotificationCategory;
        cursor?: string | null;
        limit?: number;
    }): Promise<{ items: Notification[]; nextCursor: string | null }> {
        return this.dashboardRepo.listNotifications({
            userId: input.userId,
            category: input.category,
            cursor: input.cursor ?? null,
            limit: input.limit ?? DEFAULT_PAGE_SIZE,
        });
    }
}

export class GetNextNudgeUseCase {
    constructor(private readonly dashboardRepo: IDashboardRepository) { }

    execute(userId: string): Promise<Notification | null> {
        return this.dashboardRepo.getNextPendingNudge(userId);
    }
}

export class MarkNotificationReadUseCase {
    constructor(private readonly dashboardRepo: IDashboardRepository) { }

    execute(input: { userId: string; notificationId: string }): Promise<Notification> {
        return this.dashboardRepo.markNotificationRead(input);
    }
}

export class MarkAllNotificationsReadUseCase {
    constructor(private readonly dashboardRepo: IDashboardRepository) { }

    execute(userId: string): Promise<{ updated: number }> {
        return this.dashboardRepo.markAllNotificationsRead(userId);
    }
}

export class CreateNotificationUseCase {
    constructor(private readonly dashboardRepo: IDashboardRepository) { }

    execute(input: {
        userId: string;
        category: NotificationCategory;
        icon: string;
        title: string;
        body: string;
        isNudge?: boolean;
        nudgeKind?: 'fatigue' | 'academic' | 'boe' | null;
        primaryLabel?: string | null;
        secondaryLabel?: string | null;
        actionRoute?: string | null;
    }): Promise<Notification> {
        return this.dashboardRepo.createNotification(input);
    }
}
