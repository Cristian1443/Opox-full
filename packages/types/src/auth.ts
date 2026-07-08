/**
 * Tipos compartidos del dominio de autenticación.
 * Consumidos tanto por el backend como por el mobile.
 */

export type OAuthProvider = 'google' | 'apple' | 'meta';

export interface AuthUser {
    /** UUID del usuario (Supabase auth.users.id) */
    id: string;
    email: string;
    /** Nombre visible; opcional en registros OAuth */
    displayName?: string;
    /** Fecha de aceptación de términos y privacidad (ISO 8601) */
    termsAcceptedAt?: string;
    /** Métodos de acceso activados por el usuario */
    hasBiometric: boolean;
    /** URL del avatar si se importó desde OAuth */
    avatarUrl?: string;
    createdAt: string;
    /** Oposición elegida en el onboarding (Bloque 0), ej. "Justicia" */
    oposicion?: string;
    /** Especialidad dentro de la oposición, ej. "Tramitación" */
    especialidad?: string;
}

export interface Session {
    accessToken: string;
    refreshToken: string;
    /** Segundos hasta expiración */
    expiresIn: number;
    /** Timestamp de emisión (ISO 8601) */
    issuedAt: string;
    user: AuthUser;
}

// ─── Requests / Responses del bloque 1 · Acceso ─────────

export interface RegisterRequest {
    email: string;
    password: string;
    displayName: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface OAuthLoginRequest {
    provider: OAuthProvider;
    /** ID token devuelto por el SDK del proveedor en el mobile */
    idToken: string;
}

export interface OtpSendRequest {
    email: string;
    /** Contexto del OTP: verificación de email tras registro, o login sin password */
    purpose: 'email_verification' | 'passwordless_login';
}

export interface OtpVerifyRequest {
    email: string;
    code: string;
    purpose: 'email_verification' | 'passwordless_login';
}

export interface PasswordResetRequestRequest {
    email: string;
}

export interface PasswordResetConfirmRequest {
    /** Token temporal del enlace del email de recuperación */
    resetToken: string;
    newPassword: string;
}

export interface BiometricLinkRequest {
    /** Clave pública generada en el dispositivo para verificar futuras firmas */
    devicePublicKey: string;
    /** Identificador estable del dispositivo (Expo Constants.installationId) */
    deviceId: string;
}

export interface BiometricLoginRequest {
    deviceId: string;
    /** Firma del challenge con la clave privada del dispositivo */
    signedChallenge: string;
    challengeId: string;
}

export interface BiometricChallengeResponse {
    challengeId: string;
    challenge: string;
    /** Segundos que el challenge sigue siendo válido */
    expiresIn: number;
}

export interface AcceptTermsRequest {
    /** Versión de los términos aceptados (para invalidar aceptaciones antiguas) */
    termsVersion: string;
    /** Versión de la política de privacidad aceptada */
    privacyVersion: string;
}

export interface UpdateProfileRequest {
    /** Oposición elegida en el onboarding (Bloque 0), ej. "Justicia" */
    oposicion?: string;
    /** Especialidad dentro de la oposición, ej. "Tramitación" */
    especialidad?: string;
}
