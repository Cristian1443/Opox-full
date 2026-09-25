import type { Session, IAuthRepository } from '../../domain';
import type { OAuthProvider } from '@opox/types';

export class OAuthLoginUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    execute(input: {
        provider: OAuthProvider;
        idToken?: string;
        accessToken?: string;
        firstName?: string | null;
        lastName?: string | null;
    }): Promise<Session> {
        return this.authRepo.loginWithOAuth(input);
    }
}
