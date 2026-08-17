import { DomainError } from './DomainError';

export class PreferencesNotFoundError extends DomainError {
    readonly code = 'config/preferences-not-found';
    readonly httpStatus = 404;
    constructor() { super('No se encontraron preferencias para este usuario.'); }
}

export class FeedbackInvalidError extends DomainError {
    readonly code = 'config/feedback-invalid';
    readonly httpStatus = 400;
    constructor(msg = 'El feedback enviado no es válido.') { super(msg); }
}
