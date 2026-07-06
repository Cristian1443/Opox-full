import type { Session, IAuthRepository } from '../../domain';

export class VerifyOtpUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    execute(input: {
        email: string;
        code: string;
        purpose: 'email_verification' | 'passwordless_login';
    }): Promise<Session> {
        return this.authRepo.verifyOtp({
            email: input.email.trim().toLowerCase(),
            code: input.code.trim(),
            purpose: input.purpose,
        });
    }
}
