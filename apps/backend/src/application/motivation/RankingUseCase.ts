import type { IMotivationRepository, RankingResult, RankingScope } from '../../domain';

const DEFAULT_LIMIT = 20;

export class GetRankingUseCase {
    constructor(private readonly motivationRepo: IMotivationRepository) { }

    execute(input: { userId: string; scope: RankingScope; limit?: number }): Promise<RankingResult> {
        return this.motivationRepo.listRanking({
            userId: input.userId,
            scope: input.scope,
            limit: input.limit ?? DEFAULT_LIMIT,
        });
    }
}
