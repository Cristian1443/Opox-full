import { DomainError } from './DomainError';

export class InvalidCredentialsError extends DomainError {
    readonly code = 'auth/invalid-credentials';
    readonly httpStatus = 401;
    constructor() {
        super('Email o contraseña incorrectos.');
    }
}

export class EmailAlreadyRegisteredError extends DomainError {
    readonly code = 'auth/email-already-registered';
    readonly httpStatus = 409;
    constructor(email: string) {
        super('Ese email ya tiene cuenta.', { email });
    }
}

export class AccountLockedError extends DomainError {
    readonly code = 'auth/account-locked';
    readonly httpStatus = 423;
    constructor(public readonly unlockAt: Date) {
        super('Cuenta bloqueada temporalmente.');
    }
}

export class OtpInvalidError extends DomainError {
    readonly code = 'auth/otp-invalid';
    readonly httpStatus = 400;
    constructor() {
        super('Código incorrecto. Revísalo e inténtalo de nuevo.');
    }
}

export class OtpExpiredError extends DomainError {
    readonly code = 'auth/otp-expired';
    readonly httpStatus = 410;
    constructor() {
        super('El código ha caducado. Solicita uno nuevo.');
    }
}

export class PasswordResetTokenInvalidError extends DomainError {
    readonly code = 'auth/password-reset-token-invalid';
    readonly httpStatus = 400;
    constructor() {
        super('Este enlace de recuperación no es válido o ya caducó. Solicita uno nuevo.');
    }
}

export class SessionExpiredError extends DomainError {
    readonly code = 'auth/session-expired';
    readonly httpStatus = 401;
    constructor() {
        super('Tu sesión ha caducado. Vuelve a iniciar sesión.');
    }
}

export class BiometricNotRecognizedError extends DomainError {
    readonly code = 'auth/biometric-not-recognized';
    readonly httpStatus = 401;
    constructor() {
        super('No te hemos reconocido.');
    }
}

export class TermsNotAcceptedError extends DomainError {
    readonly code = 'auth/terms-not-accepted';
    readonly httpStatus = 403;
    constructor() {
        super('Debes aceptar los términos y la política de privacidad.');
    }
}

export class UnauthorizedError extends DomainError {
    readonly code = 'common/unauthorized';
    readonly httpStatus = 401;
    constructor() {
        super('No autorizado.');
    }
}
