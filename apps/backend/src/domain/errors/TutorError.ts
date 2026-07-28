import { DomainError } from './DomainError';

export class ConversationNotFoundError extends DomainError {
    readonly code = 'tutor/conversation-not-found';
    readonly httpStatus = 404;
    constructor() { super('No encontramos esa conversación.'); }
}

export class DeckNotFoundError extends DomainError {
    readonly code = 'tutor/deck-not-found';
    readonly httpStatus = 404;
    constructor() { super('No encontramos ese mazo de flashcards.'); }
}

export class EpisodeNotFoundError extends DomainError {
    readonly code = 'tutor/episode-not-found';
    readonly httpStatus = 404;
    constructor() { super('No encontramos ese episodio de podcast.'); }
}

export class SummaryNotFoundError extends DomainError {
    readonly code = 'tutor/summary-not-found';
    readonly httpStatus = 404;
    constructor() { super('No encontramos un resumen para este tema todavía.'); }
}
