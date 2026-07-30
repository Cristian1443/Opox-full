import type { SupabaseClient } from '@supabase/supabase-js';
import type { ITutorRepository } from '../../domain';
import type {
    TutorConversation,
    TutorMessage,
    TutorFlashcardDeck,
    TutorFlashcard,
    TutorPodcastEpisode,
    TutorPodcastProgress,
    TutorSummary,
} from '../../domain/entities';
import { logger } from '@opox/utils';

export class SupabaseTutorRepository implements ITutorRepository {
    constructor(private readonly db: SupabaseClient) {}

    // ── Chat ──────────────────────────────────────────────────────────────────

    async listConversations(userId: string): Promise<TutorConversation[]> {
        const { data, error } = await this.db
            .from('tutor_conversations')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
        if (error) { logger.error('[tutor-repo] listConversations', { error }); return []; }
        return (data ?? []).map(mapConversation);
    }

    async getConversation(id: string, userId: string): Promise<TutorConversation | null> {
        const { data, error } = await this.db
            .from('tutor_conversations')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();
        if (error) { logger.error('[tutor-repo] getConversation', { error }); return null; }
        return data ? mapConversation(data) : null;
    }

    async createConversation(input: { userId: string; title: string; topic: string | null }): Promise<TutorConversation> {
        const { data, error } = await this.db
            .from('tutor_conversations')
            .insert({ user_id: input.userId, title: input.title, topic: input.topic })
            .select()
            .single();
        if (error || !data) throw new Error(`[tutor-repo] createConversation: ${error?.message}`);
        return mapConversation(data);
    }

    async deleteConversation(id: string, userId: string): Promise<void> {
        const { error } = await this.db
            .from('tutor_conversations')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) throw new Error(`[tutor-repo] deleteConversation: ${error.message}`);
    }

    async listMessages(conversationId: string, userId: string): Promise<TutorMessage[]> {
        const { data, error } = await this.db
            .from('tutor_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        if (error) { logger.error('[tutor-repo] listMessages', { error }); return []; }
        return (data ?? []).map(mapMessage);
    }

    async addMessage(input: {
        conversationId: string;
        userId: string;
        role: 'user' | 'assistant';
        content: string;
    }): Promise<TutorMessage> {
        const { data, error } = await this.db
            .from('tutor_messages')
            .insert({
                conversation_id: input.conversationId,
                user_id: input.userId,
                role: input.role,
                content: input.content,
            })
            .select()
            .single();
        if (error || !data) throw new Error(`[tutor-repo] addMessage: ${error?.message}`);

        // Actualizar last_message + updated_at de la conversación
        await this.db
            .from('tutor_conversations')
            .update({ last_message: input.content, updated_at: new Date().toISOString() })
            .eq('id', input.conversationId);

        return mapMessage(data);
    }

    // ── Flashcards ────────────────────────────────────────────────────────────

    async listDecks(userId: string): Promise<TutorFlashcardDeck[]> {
        const { data, error } = await this.db
            .from('tutor_flashcard_decks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) { logger.error('[tutor-repo] listDecks', { error }); return []; }
        return (data ?? []).map(mapDeck);
    }

    async getDeck(id: string, userId: string): Promise<TutorFlashcardDeck | null> {
        const { data, error } = await this.db
            .from('tutor_flashcard_decks')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();
        if (error) { logger.error('[tutor-repo] getDeck', { error }); return null; }
        return data ? mapDeck(data) : null;
    }

    async createDeck(input: {
        userId: string;
        topicId: string;
        topicTitle: string;
        oposicion: string;
        cards: Array<{ question: string; answer: string }>;
    }): Promise<{ deck: TutorFlashcardDeck; cards: TutorFlashcard[] }> {
        const { data: deck, error: deckErr } = await this.db
            .from('tutor_flashcard_decks')
            .insert({
                user_id: input.userId,
                topic_id: input.topicId,
                topic_title: input.topicTitle,
                oposicion: input.oposicion,
                card_count: input.cards.length,
            })
            .select()
            .single();
        if (deckErr || !deck) throw new Error(`[tutor-repo] createDeck: ${deckErr?.message}`);

        const cardRows = input.cards.map((c) => ({
            deck_id: deck.id,
            user_id: input.userId,
            question: c.question,
            answer: c.answer,
        }));
        const { data: insertedCards, error: cardsErr } = await this.db
            .from('tutor_flashcard_cards')
            .insert(cardRows)
            .select();
        if (cardsErr) throw new Error(`[tutor-repo] createDeck cards: ${cardsErr.message}`);

        return { deck: mapDeck(deck), cards: (insertedCards ?? []).map(mapCard) };
    }

    async getDeckCards(deckId: string, userId: string): Promise<TutorFlashcard[]> {
        const { data, error } = await this.db
            .from('tutor_flashcard_cards')
            .select('*')
            .eq('deck_id', deckId)
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        if (error) { logger.error('[tutor-repo] getDeckCards', { error }); return []; }
        return (data ?? []).map(mapCard);
    }

    async deleteDeck(id: string, userId: string): Promise<void> {
        const { error } = await this.db
            .from('tutor_flashcard_decks')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) throw new Error(`[tutor-repo] deleteDeck: ${error.message}`);
    }

    async saveReview(input: {
        userId: string;
        deckId: string;
        knownCount: number;
        failedCount: number;
        failedCardIds: string[];
    }): Promise<void> {
        const { error: reviewErr } = await this.db.from('tutor_flashcard_reviews').insert({
            user_id: input.userId,
            deck_id: input.deckId,
            known_count: input.knownCount,
            failed_count: input.failedCount,
        });
        if (reviewErr) throw new Error(`[tutor-repo] saveReview: ${reviewErr.message}`);

        // Reducir interval de tarjetas falladas (repetición espaciada básica)
        if (input.failedCardIds.length > 0) {
            await this.db
                .from('tutor_flashcard_cards')
                .update({ interval_days: 1, next_review_at: new Date().toISOString() })
                .in('id', input.failedCardIds)
                .eq('user_id', input.userId);
        }
    }

    // ── Podcast ───────────────────────────────────────────────────────────────

    async listEpisodes(oposicion: string): Promise<TutorPodcastEpisode[]> {
        const { data, error } = await this.db
            .from('tutor_podcast_episodes')
            .select('*')
            .eq('oposicion', oposicion)
            .order('created_at', { ascending: true });
        if (error) { logger.error('[tutor-repo] listEpisodes', { error }); return []; }
        return (data ?? []).map(mapEpisode);
    }

    async getEpisode(id: string): Promise<TutorPodcastEpisode | null> {
        const { data, error } = await this.db
            .from('tutor_podcast_episodes')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) { logger.error('[tutor-repo] getEpisode', { error }); return null; }
        return data ? mapEpisode(data) : null;
    }

    async getProgress(userId: string, episodeId: string): Promise<TutorPodcastProgress | null> {
        const { data, error } = await this.db
            .from('tutor_podcast_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('episode_id', episodeId)
            .maybeSingle();
        if (error) { logger.error('[tutor-repo] getProgress', { error }); return null; }
        return data ? mapProgress(data) : null;
    }

    async saveProgress(input: { userId: string; episodeId: string; positionSecs: number }): Promise<TutorPodcastProgress> {
        const { data, error } = await this.db
            .from('tutor_podcast_progress')
            .upsert(
                { user_id: input.userId, episode_id: input.episodeId, position_secs: input.positionSecs, updated_at: new Date().toISOString() },
                { onConflict: 'user_id,episode_id' },
            )
            .select()
            .single();
        if (error || !data) throw new Error(`[tutor-repo] saveProgress: ${error?.message}`);
        return mapProgress(data);
    }

    // ── Resúmenes ─────────────────────────────────────────────────────────────

    async listSummaries(oposicion: string): Promise<TutorSummary[]> {
        const { data, error } = await this.db
            .from('tutor_summaries')
            .select('*')
            .eq('oposicion', oposicion)
            .order('topic_title', { ascending: true });
        if (error) { logger.error('[tutor-repo] listSummaries', { error }); return []; }
        return (data ?? []).map(mapSummary);
    }

    async getSummary(topicId: string, oposicion: string): Promise<TutorSummary | null> {
        const { data, error } = await this.db
            .from('tutor_summaries')
            .select('*')
            .eq('topic_id', topicId)
            .eq('oposicion', oposicion)
            .maybeSingle();
        if (error) { logger.error('[tutor-repo] getSummary', { error }); return null; }
        return data ? mapSummary(data) : null;
    }
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapConversation(r: any): TutorConversation {
    return {
        id: r.id,
        userId: r.user_id,
        title: r.title,
        topic: r.topic ?? null,
        lastMessage: r.last_message ?? null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMessage(r: any): TutorMessage {
    return {
        id: r.id,
        conversationId: r.conversation_id,
        isAI: r.role === 'assistant',
        content: r.content,
        suggestedActions: r.suggested_actions ?? null,
        createdAt: new Date(r.created_at),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDeck(r: any): TutorFlashcardDeck {
    return {
        id: r.id,
        userId: r.user_id,
        topicId: r.topic_id,
        topicTitle: r.topic_title,
        oposicion: r.oposicion,
        cardCount: r.card_count,
        createdAt: new Date(r.created_at),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCard(r: any): TutorFlashcard {
    return {
        id: r.id,
        deckId: r.deck_id,
        userId: r.user_id,
        question: r.question,
        answer: r.answer,
        easeFactor: r.ease_factor,
        intervalDays: r.interval_days,
        nextReviewAt: r.next_review_at ? new Date(r.next_review_at) : null,
        createdAt: new Date(r.created_at),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEpisode(r: any): TutorPodcastEpisode {
    return {
        id: r.id,
        oposicion: r.oposicion,
        topicId: r.topic_id,
        title: r.topic_title,
        totalSeconds: r.duration_seconds,
        createdAt: new Date(r.created_at),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProgress(r: any): TutorPodcastProgress {
    return {
        userId: r.user_id,
        episodeId: r.episode_id,
        positionSecs: r.position_secs,
        updatedAt: new Date(r.updated_at),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSummary(r: any): TutorSummary {
    return {
        id: r.id,
        topicId: r.topic_id,
        topicTitle: r.topic_title,
        oposicion: r.oposicion,
        sections: r.sections ?? [],
        updatedAt: new Date(r.updated_at),
    };
}
