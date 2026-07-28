export interface TutorFlashcardDeck {
    id: string;
    userId: string;
    topicId: string;
    topicTitle: string;
    oposicion: string;
    cardCount: number;
    createdAt: Date;
}

export interface TutorFlashcard {
    id: string;
    deckId: string;
    userId: string;
    question: string;
    answer: string;
    easeFactor: number;
    intervalDays: number;
    nextReviewAt: Date | null;
    createdAt: Date;
}
