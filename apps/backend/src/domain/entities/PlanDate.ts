export type PlanDateKind = 'exam_deadline' | 'exam' | 'custom';

/** Fecha clave de la agenda del opositor (4.5). */
export class PlanDate {
    private constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly eventDate: string, // YYYY-MM-DD
        public readonly title: string,
        public readonly subtitle: string | null,
        public readonly kind: PlanDateKind,
        public readonly createdAt: Date,
    ) { }

    static create(props: {
        id: string;
        userId: string;
        eventDate: string;
        title: string;
        subtitle?: string | null;
        kind?: PlanDateKind;
        createdAt?: Date;
    }): PlanDate {
        return new PlanDate(
            props.id,
            props.userId,
            props.eventDate,
            props.title,
            props.subtitle ?? null,
            props.kind ?? 'custom',
            props.createdAt ?? new Date(),
        );
    }
}
