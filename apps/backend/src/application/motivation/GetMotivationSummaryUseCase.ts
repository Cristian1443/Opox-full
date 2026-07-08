import type { IDashboardRepository, IMotivationRepository } from '../../domain';

export interface MotivationSummary {
    gamification: { currentStreak: number; longestStreak: number; opopointsBalance: number };
    myClan: { id: string; name: string; initials: string; memberCount: number } | null;
}

/** Agregado de arranque de 5.1 Home de Motivación. */
export class GetMotivationSummaryUseCase {
    constructor(
        private readonly dashboardRepo: IDashboardRepository,
        private readonly motivationRepo: IMotivationRepository,
    ) { }

    async execute(userId: string): Promise<MotivationSummary> {
        const [gamification, myClan] = await Promise.all([
            this.dashboardRepo.getGamification(userId),
            this.motivationRepo.getMyClan(userId),
        ]);

        let myClanSummary: MotivationSummary['myClan'] = null;
        if (myClan) {
            const detail = await this.motivationRepo.getClanDetail({ userId, clanId: myClan.id });
            myClanSummary = {
                id: myClan.id,
                name: myClan.name,
                initials: myClan.initials,
                memberCount: detail.memberCount,
            };
        }

        return {
            gamification: {
                currentStreak: gamification.currentStreak,
                longestStreak: gamification.longestStreak,
                opopointsBalance: gamification.opopointsBalance,
            },
            myClan: myClanSummary,
        };
    }
}
