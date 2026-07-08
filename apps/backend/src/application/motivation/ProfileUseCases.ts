import type { IMotivationRepository, Profile } from '../../domain';

export class GetProfileUseCase {
    constructor(private readonly motivationRepo: IMotivationRepository) { }

    execute(userId: string): Promise<Profile> {
        return this.motivationRepo.getProfile(userId);
    }
}

export class MarkExamPassedUseCase {
    constructor(private readonly motivationRepo: IMotivationRepository) { }

    execute(userId: string): Promise<Profile> {
        return this.motivationRepo.markExamPassed(userId);
    }
}
