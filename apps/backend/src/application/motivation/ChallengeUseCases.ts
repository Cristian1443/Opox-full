import {
    ChallengeNotFoundError,
    type IMotivationRepository,
    type IDashboardRepository,
    type ChallengeWithProgress,
    type UserGamification,
} from '../../domain';

export class ListClanChallengesUseCase {
    constructor(private readonly motivationRepo: IMotivationRepository) { }

    execute(input: { userId: string; clanId: string }): Promise<ChallengeWithProgress[]> {
        return this.motivationRepo.listClanChallenges(input);
    }
}

export class CreateClanChallengeUseCase {
    constructor(private readonly motivationRepo: IMotivationRepository) { }

    execute(input: {
        userId: string;
        clanId: string;
        title: string;
        subtitle?: string;
        questionCount: number;
        rewardPoints: number;
        expiresAt?: string;
    }): Promise<ChallengeWithProgress> {
        return this.motivationRepo.createClanChallenge(input);
    }
}

export interface CompleteChallengeResult {
    gamification: UserGamification;
    alreadyCompleted: boolean;
}

/**
 * Completar un reto es autorreportado; otorga sus Opopoints vía el sistema
 * del Bloque 2 — pero solo la primera vez (si ya estaba completado, es un
 * no-op idempotente para no farmear puntos reenviando la misma request).
 */
export class CompleteChallengeUseCase {
    constructor(
        private readonly motivationRepo: IMotivationRepository,
        private readonly dashboardRepo: IDashboardRepository,
    ) { }

    async execute(input: { userId: string; clanId: string; challengeId: string }): Promise<CompleteChallengeResult> {
        const challenges = await this.motivationRepo.listClanChallenges({
            userId: input.userId,
            clanId: input.clanId,
        });
        const target = challenges.find((c) => c.challenge.id === input.challengeId);
        if (!target) throw new ChallengeNotFoundError();

        if (target.completedByMe) {
            const gamification = await this.dashboardRepo.getGamification(input.userId);
            return { gamification, alreadyCompleted: true };
        }

        await this.motivationRepo.completeChallenge({
            challengeId: input.challengeId,
            userId: input.userId,
        });

        const gamification = await this.dashboardRepo.registerActivity({
            userId: input.userId,
            reason: 'clan_challenge_completed',
            points: target.challenge.rewardPoints,
        });

        return { gamification, alreadyCompleted: false };
    }
}
