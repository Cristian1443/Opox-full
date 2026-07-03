import type { IAuthRepository } from '../../domain';

export class RequestPasswordResetUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    /**
     * Nunca revela si el email existe (patrón anti-enumeración).
     * Devuelve OK siempre. El envío real solo ocurre si el email está registrado.
     */
    async execute(email: string): Promise<void> {
        await this.authRepo.requestPasswordReset(email.trim().toLowerCase());
    }
}
