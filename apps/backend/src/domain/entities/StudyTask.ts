export type TaskKind = 'test' | 'tutor' | 'simulacro' | 'other';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

/** Tarea planificada para un día concreto (4.2 Hoy, 4.3 Semana). */
export class StudyTask {
    private constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly taskDate: string, // YYYY-MM-DD
        public readonly title: string,
        public readonly subtitle: string | null,
        public readonly kind: TaskKind,
        public readonly timeOfDay: TimeOfDay | null,
        public readonly done: boolean,
        public readonly sortOrder: number,
        public readonly createdAt: Date,
    ) { }

    static create(props: {
        id: string;
        userId: string;
        taskDate: string;
        title: string;
        subtitle?: string | null;
        kind?: TaskKind;
        timeOfDay?: TimeOfDay | null;
        done?: boolean;
        sortOrder?: number;
        createdAt?: Date;
    }): StudyTask {
        return new StudyTask(
            props.id,
            props.userId,
            props.taskDate,
            props.title,
            props.subtitle ?? null,
            props.kind ?? 'other',
            props.timeOfDay ?? null,
            props.done ?? false,
            props.sortOrder ?? 0,
            props.createdAt ?? new Date(),
        );
    }
}
