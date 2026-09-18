import type {
    IHealthCheckinRepository,
    SaveCheckinInput,
    SaveCheckinResult,
} from '../../domain/repositories';
import type { DailyCheckin } from '../../domain/entities';

export class SaveDailyCheckinUseCase {
    constructor(private readonly repo: IHealthCheckinRepository) {}

    async execute(input: SaveCheckinInput): Promise<SaveCheckinResult> {
        return this.repo.save(input);
    }
}

export class GetDailyCheckinUseCase {
    constructor(private readonly repo: IHealthCheckinRepository) {}

    async execute(userId: string, localDate: string): Promise<DailyCheckin | null> {
        return this.repo.getByDate(userId, localDate);
    }
}
