import type { IDashboardRepository, IMotivationRepository } from '../../domain';

const RECENT_DAYS = 14;

// Escalera de hitos de racha. Sin IA: tabla fija (ver AGENTS.md).
const STREAK_MILESTONES: Array<{ days: number; points: number }> = [
    { days: 7, points: 50 },
    { days: 14, points: 100 },
    { days: 21, points: 200 },
    { days: 30, points: 300 },
    { days: 60, points: 500 },
    { days: 100, points: 1000 },
];

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
