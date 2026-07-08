import type { IMotivationRepository, ClanMessage } from '../../domain';

const DEFAULT_LIMIT = 50;

/** Chat de clan por polling (5.7) — sin websockets en el MVP. */
export class ListClanMessagesUseCase {
    constructor(private readonly motivationRepo: IMotivationRepository) { }

    execute(input: { userId: string; clanId: string; after?: string | null; limit?: number }): Promise<ClanMessage[]> {
        return this.motivationRepo.listClanMessages({
            clanId: input.clanId,
            userId: input.userId,
            after: input.after ?? null,
            limit: input.limit ?? DEFAULT_LIMIT,
        });
    }
}

export class SendClanMessageUseCase {
    constructor(private readonly motivationRepo: IMotivationRepository) { }

    execute(input: { userId: string; clanId: string; body: string }): Promise<ClanMessage> {
        return this.motivationRepo.sendClanMessage(input);
    }
}
