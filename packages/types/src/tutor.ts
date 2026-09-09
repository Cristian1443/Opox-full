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

// Podcast — generación bajo demanda
export interface GeneratePodcastRequest {
    topicId: string;
    topicTitle: string;
    oposicion: string;
    /** 'corta' (5 min) | 'media' (10 min). Default: 'media'. */
    duracion?: 'corta' | 'media';
    /** 0.5 | 1.0 | 1.5 | 2.0. Default: 1.0. */
    velocidad?: number;
}

export interface GeneratePodcastResponse {
    /** ID sintético `motor-{filename}` — no vive en tutor_podcast_episodes. */
    episodeId: string;
    title: string;
    /** Nombre del archivo mp3 (podcast-xxxxx.mp3). El mobile construye la URL final
     *  concatenando `${API_BASE_URL}/tutor/podcast/audio/{filename}` que apunta al
     *  proxy del backend (necesario porque el mp3 del Motor requiere X-API-Key). */
    filename: string;
    totalSeconds: number;
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
