import type { IAuthRepository } from '../../domain';

export class DeleteAccountUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    execute(userId: string): Promise<void> {
        return this.authRepo.deleteAccount(userId);
    }
}
