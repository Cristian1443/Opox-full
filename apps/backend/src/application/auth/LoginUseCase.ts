import type { Session, IAuthRepository } from '../../domain';

/**
 * Caso de uso: login con email + password.
 * El repositorio ya se encarga de traducir errores de Supabase a
 * DomainError concretos (InvalidCredentialsError, AccountLockedError, etc.).
 */
export class LoginUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    execute(input: { email: string; password: string }): Promise<Session> {
        return this.authRepo.loginWithEmail({
            email: input.email.trim().toLowerCase(),
            password: input.password,
        });
    }
}
