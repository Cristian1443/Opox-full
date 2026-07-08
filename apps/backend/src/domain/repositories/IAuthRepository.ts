import { Session, User } from '../entities';

/**
 * Contrato del repositorio de autenticación.
 * La capa de dominio define QUÉ operaciones existen; la infraestructura
 * decide CÓMO implementarlas (Supabase, Clerk, custom JWT, etc.).
 *
 * Los use cases dependen SOLO de esta interfaz — nunca de una
 * implementación concreta. Eso permite testear con un stub en memoria.
 */
export interface IAuthRepository {
    // ─── Email + password ─────────────────────────
    registerWithEmail(input: {
        email: string;
        password: string;
        displayName: string;
    }): Promise<Session>;

    loginWithEmail(input: { email: string; password: string }): Promise<Session>;

    // ─── OAuth (Google / Apple / Meta) ────────────
    loginWithOAuth(input: {
        provider: 'google' | 'apple' | 'meta';
        idToken: string;
    }): Promise<Session>;

    // ─── OTP por email ────────────────────────────
    sendOtp(input: {
        email: string;
        purpose: 'email_verification' | 'passwordless_login';
    }): Promise<void>;

    verifyOtp(input: {
        email: string;
        code: string;
        purpose: 'email_verification' | 'passwordless_login';
    }): Promise<Session>;

    // ─── Recuperación de contraseña ───────────────
    requestPasswordReset(email: string): Promise<void>;
    confirmPasswordReset(input: { resetToken: string; newPassword: string }): Promise<Session>;

    // ─── Biometría ────────────────────────────────
    /**
     * Genera un challenge que el mobile firma con la clave privada del dispositivo.
     * TODO: implementar cuando conectemos expo-local-authentication end-to-end.
     */
    createBiometricChallenge(deviceId: string): Promise<{
        challengeId: string;
        challenge: string;
        expiresIn: number;
    }>;

    linkBiometric(input: {
        userId: string;
        devicePublicKey: string;
        deviceId: string;
    }): Promise<void>;

    loginWithBiometric(input: {
        deviceId: string;
        challengeId: string;
        signedChallenge: string;
    }): Promise<Session>;

    // ─── Sesión ───────────────────────────────────
    getSession(accessToken: string): Promise<Session>;
    refreshSession(refreshToken: string): Promise<Session>;
    logout(accessToken: string): Promise<void>;

    // ─── Términos ─────────────────────────────────
    acceptTerms(input: {
        userId: string;
        termsVersion: string;
        privacyVersion: string;
    }): Promise<User>;

    // ─── Perfil ───────────────────────────────────
    /**
     * Actualiza campos de perfil que no son credenciales (oposición,
     * especialidad). Usado hoy por el Bloque 2 para mostrar el saludo
     * real en el Dashboard; el Bloque 0 podrá llamarlo tras el
     * selector de oposición.
     */
    updateProfile(input: {
        userId: string;
        oposicion?: string;
        especialidad?: string;
    }): Promise<User>;
}
