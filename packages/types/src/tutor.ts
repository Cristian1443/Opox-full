// ─── Bloque 8 · Aula Virtual / Tutor IA ────────────────────────────────────

// Chat
export interface TutorConversation {
    id: string;
    title: string;
    topic: string | null;
    lastMessage: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TutorMessage {
    id: string;
    conversationId: string;
    isAI: boolean;
    content: string;
    suggestedActions: Array<{ label: string; icon: string }> | null;
    createdAt: string;
}

// Flashcards
export interface TutorFlashcardDeck {
    id: string;
    topicId: string;
    topicTitle: string;
    oposicion: string;
    cardCount: number;
    createdAt: string;
}

export interface TutorFlashcard {
    id: string;
    deckId: string;
    question: string;
    answer: string;
    easeFactor: number;
    intervalDays: number;
    nextReviewAt: string | null;
}

// Podcast
export interface TutorPodcastEpisode {
    id: string;
    oposicion: string;
    topicId: string;
    title: string;
    totalSeconds: number;
    createdAt: string;
}

export interface TutorPodcastProgress {
    episodeId: string;
    positionSecs: number;
    updatedAt: string;
}

// Resúmenes
export interface TutorSummarySection {
    id: string;
    type: 'principles' | 'structure' | 'reminder';
    title: string;
    icon: string;
    content: string[];
}

export interface TutorSummary {
    topicId: string;
    topicTitle: string;
    oposicion: string;
    sections: TutorSummarySection[];
    updatedAt: string;
}
