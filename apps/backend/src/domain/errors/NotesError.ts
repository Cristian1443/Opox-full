import { DomainError } from './DomainError';

export class NoteNotFoundError extends DomainError {
    readonly code = 'notes/not-found';
    readonly httpStatus = 404;
    constructor() { super('No encontramos ese apunte.'); }
}

export class NoteInvalidFormatError extends DomainError {
    readonly code = 'notes/invalid-format';
    readonly httpStatus = 400;
    constructor() {
        super('Formato no soportado. Solo admitimos imágenes (JPG, PNG, HEIC, WEBP) y PDF.');
    }
}

export class NoteFileTooLargeError extends DomainError {
    readonly code = 'notes/file-too-large';
    readonly httpStatus = 413;
    constructor() {
        super('El archivo excede el tamaño máximo permitido.');
    }
}

export class NoteNotReadyError extends DomainError {
    readonly code = 'notes/not-ready';
    readonly httpStatus = 409;
    constructor() {
        super('Este apunte aún está siendo procesado.');
    }
}
