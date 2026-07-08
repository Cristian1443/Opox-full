import type { IMotivationRepository, Clan, ClanSummary, ClanDetail } from '../../domain';

const DEFAULT_LIST_LIMIT = 20;

export class GetMyClanUseCase {
    constructor(private readonly motivationRepo: IMotivationRepository) { }

    execute(userId: string): Promise<Clan | null> {
        return this.motivationRepo.getMyClan(userId);
    }
}

export class ListClansUseCase {
    constructor(private readonly motivationRepo: IMotivationRepository) { }

    execute(input: { userId: string; limit?: number }): Promise<ClanSummary[]> {
        return this.motivationRepo.listClans({ userId: input.userId, limit: input.limit ?? DEFAULT_LIST_LIMIT });
    }
}

export class CreateClanUseCase {
    constructor(private readonly motivationRepo: IMotivationRepository) { }

    execute(input: { userId: string; name: string; initials: string; description?: string }): Promise<Clan> {
        return this.motivationRepo.createClan(input);
    }
}

export class JoinClanUseCase {
    constructor(private readonly motivationRepo: IMotivationRepository) { }

    execute(input: { userId: string; clanId: string }): Promise<void> {
        return this.motivationRepo.joinClan(input);
    }
}

export class GetClanDetailUseCase {
    constructor(private readonly motivationRepo: IMotivationRepository) { }

    execute(input: { userId: string; clanId: string }): Promise<ClanDetail> {
        return this.motivationRepo.getClanDetail(input);
    }
}
