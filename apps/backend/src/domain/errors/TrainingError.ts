import { DomainError } from './DomainError';

export class MockExamNotFoundError extends DomainError {
    readonly code = 'training/mock-exam-not-found';
    readonly httpStatus = 404;
    constructor() { super('No encontramos ese simulacro.'); }
}

export class BookmarkNotFoundError extends DomainError {
    readonly code = 'training/bookmark-not-found';
    readonly httpStatus = 404;
    constructor() { super('No encontramos esa flashcard guardada.'); }
}

export class PhotoAnalysisError extends DomainError {
    readonly code = 'training/photo-analysis-failed';
    readonly httpStatus = 422;
    constructor(reason?: string) {
        super(reason ?? 'No pudimos analizar la imagen. Intenta con otra foto.');
    }
}
