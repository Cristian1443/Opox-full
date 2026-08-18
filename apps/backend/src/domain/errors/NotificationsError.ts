import { DomainError } from './DomainError';

export class PushTokenInvalidError extends DomainError {
    readonly code = 'notifications/invalid-token';
    readonly httpStatus = 400;

    constructor(message = 'El token de notificación no es válido.') {
        super(message);
    }
}
