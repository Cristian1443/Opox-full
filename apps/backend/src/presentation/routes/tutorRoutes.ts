import { Router } from 'express';
import { API_ROUTES } from '@opox/constants';
import type { TutorController } from '../controllers/TutorController';
import { validateBody, validateQuery } from '../middleware/validate';
import {
    createConversationBody,
    sendMessageBody,
    generateDeckBody,
    submitReviewBody,
    saveProgressBody,
    oposicionQuery,
} from '../validators/tutorValidators';
import type { RequestHandler } from 'express';

export function createTutorRouter(
    controller: TutorController,
    authMiddleware: RequestHandler,
): Router {
    const r = Router();
    const T = API_ROUTES.TUTOR;

    // ── Chat ──────────────────────────────────────────────────────────────────
    r.get(T.CONVERSATIONS, authMiddleware, controller.listConversations);
    r.post(T.CONVERSATIONS, authMiddleware, validateBody(createConversationBody), controller.createConversation);
    r.get(T.CONVERSATION, authMiddleware, controller.getConversation);
    r.delete(T.CONVERSATION, authMiddleware, controller.deleteConversation);
    r.post(T.MESSAGES, authMiddleware, validateBody(sendMessageBody), controller.sendMessage);

    // ── Flashcards ────────────────────────────────────────────────────────────
    r.get(T.DECKS, authMiddleware, controller.listDecks);
    r.post(T.DECKS, authMiddleware, validateBody(generateDeckBody), controller.generateDeck);
    r.get(T.DECK, authMiddleware, controller.getDeck);
    r.delete(T.DECK, authMiddleware, controller.deleteDeck);
    r.post(T.DECK_REVIEW, authMiddleware, validateBody(submitReviewBody), controller.submitReview);

    // ── Podcast ───────────────────────────────────────────────────────────────
    r.get(T.EPISODES, authMiddleware, validateQuery(oposicionQuery), controller.listEpisodes);
    r.get(T.EPISODE, authMiddleware, controller.getEpisode);
    r.get(T.PODCAST_PROGRESS, authMiddleware, controller.getProgress);
    r.post(T.PODCAST_PROGRESS, authMiddleware, validateBody(saveProgressBody), controller.saveProgress);

    // ── Resúmenes ─────────────────────────────────────────────────────────────
    r.get(T.SUMMARIES, authMiddleware, validateQuery(oposicionQuery), controller.listSummaries);
    r.get(T.SUMMARY, authMiddleware, validateQuery(oposicionQuery), controller.getSummary);

    return r;
}
