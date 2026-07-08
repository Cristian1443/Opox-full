/**
 * Espejo consultable del perfil público de un usuario (tabla `profiles`).
 * Distinto de `User`: `User` es la entidad de auth (credenciales, sesión);
 * `Profile` es lo que rankings/clanes necesitan mostrar de otros usuarios.
 */
export class Profile {
    private constructor(
        public readonly id: string,
        public readonly displayName: string | null,
        public readonly oposicion: string | null,
        public readonly especialidad: string | null,
        public readonly avatarUrl: string | null,
        public readonly passedExamAt: Date | null,
    ) { }

    static create(props: {
        id: string;
        displayName?: string | null;
        oposicion?: string | null;
        especialidad?: string | null;
        avatarUrl?: string | null;
        passedExamAt?: Date | null;
    }): Profile {
        return new Profile(
            props.id,
            props.displayName ?? null,
            props.oposicion ?? null,
            props.especialidad ?? null,
            props.avatarUrl ?? null,
            props.passedExamAt ?? null,
        );
    }
}
