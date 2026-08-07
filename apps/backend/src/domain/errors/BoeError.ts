import { DomainError } from './DomainError';

export class BoeRegulationNotFoundError extends DomainError {
    readonly code = 'boe/regulation-not-found';
    readonly httpStatus = 404;
    constructor() { super('No encontramos esa norma en seguimiento.'); }
}

export class BoeRegulationAlreadyFollowedError extends DomainError {
    readonly code = 'boe/already-followed';
    readonly httpStatus = 409;
    constructor() { super('Ya estás siguiendo esa norma.'); }
}

export class BoeChangeNotFoundError extends DomainError {
    readonly code = 'boe/change-not-found';
    readonly httpStatus = 404;
    constructor() { super('No encontramos ese cambio legislativo.'); }
}

export class BoeInvalidIdentifierError extends DomainError {
    readonly code = 'boe/invalid-identifier';
    readonly httpStatus = 422;
    constructor() {
        super('Identificador BOE inválido. Usa el formato BOE-A-AAAA-NNNNN.');
    }
}
