import type { Session, IAuthRepository } from '../../domain';

export class GetSessionUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    execute(accessToken: string): Promise<Session> {
        return this.authRepo.getSession(accessToken);
    }
}

export class RefreshSessionUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    execute(refreshToken: string): Promise<Session> {
        return this.authRepo.refreshSession(refreshToken);
    }
}

export class LogoutUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    execute(accessToken: string): Promise<void> {
        return this.authRepo.logout(accessToken);
    }
}
