import { DomainError } from './DomainError';

export class StudyTaskNotFoundError extends DomainError {
    readonly code = 'planning/task-not-found';
    readonly httpStatus = 404;
    constructor() {
        super('No encontramos esa tarea.');
    }
}
