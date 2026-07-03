import type { Session, IAuthRepository } from '../../domain';

export class ConfirmPasswordResetUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    execute(input: { resetToken: string; newPassword: string }): Promise<Session> {
        return this.authRepo.confirmPasswordReset(input);
    }
}
