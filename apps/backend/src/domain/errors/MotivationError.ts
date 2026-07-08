import { DomainError } from './DomainError';

export class ClanNotFoundError extends DomainError {
    readonly code = 'motivation/clan-not-found';
    readonly httpStatus = 404;
    constructor() {
        super('No encontramos ese clan.');
    }
}

export class AlreadyInClanError extends DomainError {
    readonly code = 'motivation/already-in-clan';
    readonly httpStatus = 409;
    constructor() {
        super('Ya perteneces a un clan. Sal del actual antes de unirte a otro.');
    }
}

export class NotClanMemberError extends DomainError {
    readonly code = 'motivation/not-clan-member';
    readonly httpStatus = 403;
    constructor() {
        super('No perteneces a este clan.');
    }
}

export class ChallengeNotFoundError extends DomainError {
    readonly code = 'motivation/challenge-not-found';
    readonly httpStatus = 404;
    constructor() {
        super('No encontramos ese reto.');
    }
}
