/**
 * Entidad de dominio User.
 * Representa un usuario dentro de la lógica de negocio, independiente
 * de cómo Supabase (o cualquier otro provider) lo almacene.
 */
export class User {
    private constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly displayName: string | null,
        public readonly termsAcceptedAt: Date | null,
        public readonly hasBiometric: boolean,
        public readonly avatarUrl: string | null,
        public readonly createdAt: Date,
    ) { }

    static create(props: {
        id: string;
        email: string;
        displayName?: string | null;
        termsAcceptedAt?: Date | null;
        hasBiometric?: boolean;
        avatarUrl?: string | null;
        createdAt?: Date;
    }): User {
        return new User(
            props.id,
            props.email.toLowerCase().trim(),
            props.displayName?.trim() || null,
            props.termsAcceptedAt || null,
            props.hasBiometric ?? false,
            props.avatarUrl || null,
            props.createdAt || new Date(),
        );
    }

    /** Regla de dominio: el usuario debe haber aceptado términos para operar */
    hasAcceptedTerms(): boolean {
        return this.termsAcceptedAt !== null;
    }
}
