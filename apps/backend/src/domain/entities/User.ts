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
        /** Oposición elegida en el onboarding (Bloque 0), ej. "Justicia" */
        public readonly oposicion: string | null,
        /** Especialidad dentro de la oposición, ej. "Tramitación" */
        public readonly especialidad: string | null,
    ) { }

    static create(props: {
        id: string;
        email: string;
        displayName?: string | null;
        termsAcceptedAt?: Date | null;
        hasBiometric?: boolean;
        avatarUrl?: string | null;
        createdAt?: Date;
        oposicion?: string | null;
        especialidad?: string | null;
    }): User {
        return new User(
            props.id,
            props.email.toLowerCase().trim(),
            props.displayName?.trim() || null,
            props.termsAcceptedAt || null,
            props.hasBiometric ?? false,
            props.avatarUrl || null,
            props.createdAt || new Date(),
            props.oposicion?.trim() || null,
            props.especialidad?.trim() || null,
        );
    }

    /** Regla de dominio: el usuario debe haber aceptado términos para operar */
    hasAcceptedTerms(): boolean {
        return this.termsAcceptedAt !== null;
    }
}
