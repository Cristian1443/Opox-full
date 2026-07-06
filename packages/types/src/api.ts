/**
 * Envoltorios genéricos para respuestas HTTP.
 * Todas las rutas del backend deben devolver ApiResponse<T> o ApiErrorResponse.
 */

export interface ApiSuccessResponse<T> {
    ok: true;
    data: T;
}

export interface ApiErrorResponse {
    ok: false;
    error: {
        /** Código estable para que el cliente decida qué UI mostrar */
        code: string;
        /** Mensaje humano en español (fallback si el cliente no reconoce el code) */
        message: string;
        /** Detalles opcionales de validación por campo */
        fields?: Record<string, string>;
    };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedResponse<T> {
    items: T[];
    /** Cursor para la siguiente página; null si no hay más */
    nextCursor: string | null;
    /** Total conocido; opcional porque no siempre se puede calcular barato */
    total?: number;
}

/**
 * Códigos de error estables entre backend y mobile.
 * El mobile los mapea a UI (toast rojo, modal, error inline, etc.).
 */
export const ErrorCode = {
    // Auth
    INVALID_CREDENTIALS: 'auth/invalid-credentials',
    EMAIL_ALREADY_REGISTERED: 'auth/email-already-registered',
    ACCOUNT_LOCKED: 'auth/account-locked',
    OTP_INVALID: 'auth/otp-invalid',
    OTP_EXPIRED: 'auth/otp-expired',
    TERMS_NOT_ACCEPTED: 'auth/terms-not-accepted',
    SESSION_EXPIRED: 'auth/session-expired',
    BIOMETRIC_NOT_RECOGNIZED: 'auth/biometric-not-recognized',
    // Validación
    VALIDATION_FAILED: 'validation/failed',
    // Genéricos
    UNAUTHORIZED: 'common/unauthorized',
    FORBIDDEN: 'common/forbidden',
    NOT_FOUND: 'common/not-found',
    INTERNAL_ERROR: 'common/internal-error',
    NETWORK_ERROR: 'common/network-error',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];
