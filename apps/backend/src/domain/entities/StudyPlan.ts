export type PlanIntensity = 'low' | 'medium' | 'high';

/** Ajustes de ritmo del plan de estudio (4.6). Una fila por usuario. */
export class StudyPlan {
    private constructor(
        public readonly userId: string,
        public readonly testsPerDay: number,
        /** Días ISO: 1=lunes .. 7=domingo */
        public readonly studyDays: number[],
        public readonly intensity: PlanIntensity,
        public readonly examDate: string | null, // YYYY-MM-DD
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(props: {
        userId: string;
        testsPerDay?: number;
        studyDays?: number[];
        intensity?: PlanIntensity;
        examDate?: string | null;
        createdAt?: Date;
        updatedAt?: Date;
    }): StudyPlan {
        return new StudyPlan(
            props.userId,
            props.testsPerDay ?? 3,
            props.studyDays ?? [1, 2, 3, 4, 5],
            props.intensity ?? 'medium',
            props.examDate ?? null,
            props.createdAt ?? new Date(),
            props.updatedAt ?? new Date(),
        );
    }
}
