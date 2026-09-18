import type {
    TutorConversation,
    TutorMessage,
    TutorFlashcardDeck,
    TutorFlashcard,
    TutorPodcastEpisode,
    TutorPodcastProgress,
    TutorSummary,
} from '../entities';

export interface ITutorRepository {
    // ── Chat ──────────────────────────────────────────────────────────────────
    listConversations(userId: string): Promise<TutorConversation[]>;
    getConversation(id: string, userId: string): Promise<TutorConversation | null>;
    createConversation(data: { userId: string; title: string; topic: string | null }): Promise<TutorConversation>;
    deleteConversation(id: string, userId: string): Promise<void>;
    listMessages(conversationId: string, userId: string): Promise<TutorMessage[]>;
    addMessage(data: {
        conversationId: string;
        userId: string;
        role: 'user' | 'assistant';
        content: string;
        suggestedActions?: Array<{ label: string; icon: string }> | null;
    }): Promise<TutorMessage>;

    // ── Flashcards ────────────────────────────────────────────────────────────
    listDecks(userId: string): Promise<TutorFlashcardDeck[]>;
    getDeck(id: string, userId: string): Promise<TutorFlashcardDeck | null>;
    createDeck(data: {
        userId: string;
        topicId: string;
        topicTitle: string;
        oposicion: string;
        cards: Array<{ question: string; answer: string }>;
    }): Promise<{ deck: TutorFlashcardDeck; cards: TutorFlashcard[] }>;
    getDeckCards(deckId: string, userId: string): Promise<TutorFlashcard[]>;
    deleteDeck(id: string, userId: string): Promise<void>;
    saveReview(data: {
        userId: string;
        deckId: string;
        knownCount: number;
        failedCount: number;
        failedCardIds: string[];
    }): Promise<void>;

    // ── Podcast ───────────────────────────────────────────────────────────────
    listEpisodes(oposicion: string): Promise<TutorPodcastEpisode[]>;
    getEpisode(id: string): Promise<TutorPodcastEpisode | null>;
    getProgress(userId: string, episodeId: string): Promise<TutorPodcastProgress | null>;
    saveProgress(data: { userId: string; episodeId: string; positionSecs: number }): Promise<TutorPodcastProgress>;

    // ── Resúmenes ─────────────────────────────────────────────────────────────
    listSummaries(oposicion: string): Promise<TutorSummary[]>;
    getSummary(topicId: string, oposicion: string): Promise<TutorSummary | null>;

    // ── Utilidades de chat ────────────────────────────────────────────────────
    // Traduce menciones a "Tema N" en un mensaje de chat al título real del
    // temario (que el Motor sí conoce). El resultado se envía al Motor RAG;
    // el mensaje original se persiste en la conversación tal cual lo escribió
    // el usuario.
    resolveTopicReferences(oposicion: string | null | undefined, message: string): Promise<string>;
}
