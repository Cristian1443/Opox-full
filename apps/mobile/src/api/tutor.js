import { api } from './client';
import { API_ROUTES } from '@opox/constants';

const T = API_ROUTES.TUTOR;

export const tutorApi = {
    // ── Chat ─────────────────────────────────────────────────────────────────
    listConversations: () =>
        api.get(T.CONVERSATIONS, { auth: true }),

    getConversation: (id) =>
        api.get(T.CONVERSATION.replace(':id', id), { auth: true }),

    createConversation: (title = 'Nueva conversación', topic = null) =>
        api.post(T.CONVERSATIONS, { title, topic }, { auth: true }),

    // tonePrefs = { personality, detailLevel, hintStyle, reinforcementLevel } de AsyncStorage
    sendMessage: (conversationId, content, tonePrefs = null) =>
        api.post(
            T.MESSAGES.replace(':id', conversationId),
            tonePrefs ? { content, tonePrefs } : { content },
            { auth: true },
        ),

    deleteConversation: (id) =>
        api.delete(T.CONVERSATION.replace(':id', id), { auth: true }),

    // ── Flashcards ────────────────────────────────────────────────────────────
    listDecks: () =>
        api.get(T.DECKS, { auth: true }),

    getDeck: (id) =>
        api.get(T.DECK.replace(':id', id), { auth: true }),

    generateDeck: (topicId, topicTitle, oposicion) =>
        api.post(T.DECKS, { topicId, topicTitle, oposicion }, { auth: true }),

    deleteDeck: (id) =>
        api.delete(T.DECK.replace(':id', id), { auth: true }),

    submitReview: (deckId, knownCount, failedCount, failedCardIds = []) =>
        api.post(
            T.DECK_REVIEW.replace(':id', deckId),
            { knownCount, failedCount, failedCardIds },
            { auth: true },
        ),

    // ── Podcast ───────────────────────────────────────────────────────────────
    listEpisodes: (oposicion) =>
        api.get(`${T.EPISODES}?oposicion=${encodeURIComponent(oposicion)}`, { auth: true }),

    getEpisode: (id) =>
        api.get(T.EPISODE.replace(':id', id), { auth: true }),

    getProgress: (episodeId) =>
        api.get(T.PODCAST_PROGRESS.replace(':episodeId', episodeId), { auth: true }),

    saveProgress: (episodeId, positionSecs) =>
        api.post(
            T.PODCAST_PROGRESS.replace(':episodeId', episodeId),
            { positionSecs },
            { auth: true },
        ),

    // ── Resúmenes ─────────────────────────────────────────────────────────────
    listSummaries: (oposicion) =>
        api.get(`${T.SUMMARIES}?oposicion=${encodeURIComponent(oposicion)}`, { auth: true }),

    getSummary: (topicId, oposicion) =>
        api.get(
            `${T.SUMMARY.replace(':topicId', topicId)}?oposicion=${encodeURIComponent(oposicion)}`,
            { auth: true },
        ),
};
