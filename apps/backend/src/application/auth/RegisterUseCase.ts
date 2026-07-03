import type { Session, IAuthRepository } from '../../domain';

/**
 * Caso de uso: registro con email + password.
 * Con "Confirm email" activado en Supabase, signUp devuelve una sesión
 * con accessToken vacío (aún no hay verificación) y el propio Supabase
 * envía el OTP al email — no hace falta llamar a sendOtp aquí porque
 * duplicaría el email (o pegaría contra el rate limit).
 *
 * El mobile detecta la sesión vacía y transiciona a la screen 1.6 (Otp).
 */
export class RegisterUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    execute(input: {
        email: string;
        password: string;
        displayName: string;
    }): Promise<Session> {
        return this.authRepo.registerWithEmail({
            email: input.email.trim().toLowerCase(),
            password: input.password,
            displayName: input.displayName.trim(),
        });
    }
}
