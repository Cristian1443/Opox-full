import type { IAuthRepository, User } from '../../domain';

export class UpdateProfileUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    execute(input: { userId: string; oposicion?: string; especialidad?: string }): Promise<User> {
        return this.authRepo.updateProfile(input);
    }
}
