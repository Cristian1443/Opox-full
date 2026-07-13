/** Flashcard guardada por el usuario desde el Foto-Test (pantalla 6.5). */
export class TrainingBookmark {
    private constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly concept: string,
        public readonly question: string,
        public readonly answer: string,
        public readonly relatedTopicId: string | null,
        public readonly createdAt: Date,
    ) { }

    static create(props: {
        id: string;
        userId: string;
        concept: string;
        question: string;
        answer: string;
        relatedTopicId?: string | null;
        createdAt?: Date;
    }): TrainingBookmark {
        return new TrainingBookmark(
            props.id,
            props.userId,
            props.concept,
            props.question,
            props.answer,
            props.relatedTopicId ?? null,
            props.createdAt ?? new Date(),
        );
    }
}
