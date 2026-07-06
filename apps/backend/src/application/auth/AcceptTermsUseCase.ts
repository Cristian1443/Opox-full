import type { User, IAuthRepository } from '../../domain';

export class AcceptTermsUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    execute(input: {
        userId: string;
        termsVersion: string;
        privacyVersion: string;
    }): Promise<User> {
        return this.authRepo.acceptTerms(input);
    }
}
