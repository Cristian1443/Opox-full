import type { IDashboardRepository, UserGamification } from '../../domain';

export class GetGamificationUseCase {
    constructor(private readonly dashboardRepo: IDashboardRepository) { }

    execute(userId: string): Promise<UserGamification> {
        return this.dashboardRepo.getGamification(userId);
    }
}

export class RegisterActivityUseCase {
    constructor(private readonly dashboardRepo: IDashboardRepository) { }

    execute(input: { userId: string; reason: string; points: number }): Promise<UserGamification> {
        return this.dashboardRepo.registerActivity(input);
    }
}
