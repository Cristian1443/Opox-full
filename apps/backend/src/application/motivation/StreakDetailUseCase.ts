import { STREAK_MILESTONES } from '@opox/types';
import type { IDashboardRepository, IMotivationRepository } from '../../domain';

const RECENT_DAYS = 14;

// La escalera de hitos vive ahora en `@opox/types` para que backend, mobile y
// SupabaseDashboardRepository.registerActivity compartan una sola fuente de
// verdad — antes cada uno duplicaba la tabla y solo este use case la leía,
// dejando la lógica de OTORGAR el premio sin implementar en registerActivity.

export interface StreakDetail {
    currentStreak: number;
    longestStreak: number;
    /** Fechas (YYYY-MM-DD) con actividad en los últimos 14 días. */
    recentActivityDates: string[];
    nextMilestone: { days: number; points: number; remaining: number } | null;
}

export class GetStreakDetailUseCase {
    constructor(
        private readonly dashboardRepo: IDashboardRepository,
        private readonly motivationRepo: IMotivationRepository,
    ) { }

    async execute(userId: string): Promise<StreakDetail> {
        const [gamification, recentActivityDates] = await Promise.all([
            this.dashboardRepo.getGamification(userId),
            this.motivationRepo.getRecentActivityDays(userId, RECENT_DAYS),
        ]);

        const next = STREAK_MILESTONES.find((m) => m.days > gamification.currentStreak) ?? null;

        return {
            currentStreak: gamification.currentStreak,
            longestStreak: gamification.longestStreak,
            recentActivityDates,
            nextMilestone: next
                ? { days: next.days, points: next.points, remaining: next.days - gamification.currentStreak }
                : null,
        };
    }
}
