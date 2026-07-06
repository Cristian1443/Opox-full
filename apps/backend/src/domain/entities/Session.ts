import { User } from './User';

/**
 * Sesión activa de un usuario. Encapsula los tokens y metadata mínima
 * necesaria para autorizar peticiones.
 */
export class Session {
    private constructor(
        public readonly accessToken: string,
        public readonly refreshToken: string,
        public readonly expiresIn: number,
        public readonly issuedAt: Date,
        public readonly user: User,
    ) { }

    static create(props: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        issuedAt?: Date;
        user: User;
    }): Session {
        return new Session(
            props.accessToken,
            props.refreshToken,
            props.expiresIn,
            props.issuedAt || new Date(),
            props.user,
        );
    }

    isExpired(now: Date = new Date()): boolean {
        const expiresAt = this.issuedAt.getTime() + this.expiresIn * 1000;
        return now.getTime() >= expiresAt;
    }
}
