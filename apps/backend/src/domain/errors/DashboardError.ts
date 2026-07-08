import { DomainError } from './DomainError';

export class NotificationNotFoundError extends DomainError {
    readonly code = 'dashboard/notification-not-found';
    readonly httpStatus = 404;
    constructor() {
        super('No encontramos esa notificación.');
    }
}
