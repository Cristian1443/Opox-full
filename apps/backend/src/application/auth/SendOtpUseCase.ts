import type { IAuthRepository } from '../../domain';

export class SendOtpUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    execute(input: {
        email: string;
        purpose: 'email_verification' | 'passwordless_login';
    }): Promise<void> {
        return this.authRepo.sendOtp({
            email: input.email.trim().toLowerCase(),
            purpose: input.purpose,
        });
    }
}
