import type { Request, Response, NextFunction } from 'express';
import type {
    TutorConversation as TutorConversationDTO,
    TutorMessage as TutorMessageDTO,
    TutorFlashcardDeck as TutorFlashcardDeckDTO,
    TutorFlashcard as TutorFlashcardDTO,
    TutorPodcastEpisode as TutorPodcastEpisodeDTO,
    TutorPodcastProgress as TutorPodcastProgressDTO,
    TutorSummary as TutorSummaryDTO,
    ApiSuccessResponse,
} from '@opox/types';
import { buildToneProfile } from '../../application/config/ConfigUseCases';
import type {
    ListConversationsUseCase,
    GetConversationUseCase,
    CreateConversationUseCase,
    SendMessageUseCase,
    DeleteConversationUseCase,
    ListDecksUseCase,
    GetDeckWithCardsUseCase,
    GenerateDeckUseCase,
    DeleteDeckUseCase,
    SubmitReviewUseCase,
    ListEpisodesUseCase,
    GetEpisodeUseCase,
    GetProgressUseCase,
    SaveProgressUseCase,
    ListSummariesUseCase,
    GetSummaryUseCase,
    GetCursoIdUseCase,
    GeneratePodcastUseCase,
    ProxyPodcastAudioUseCase,
} from '../../application';
import type {
    TutorConversation,
    TutorMessage,
    TutorFlashcardDeck,
    TutorFlashcard,
    TutorPodcastEpisode,
    TutorPodcastProgress,
    TutorSummary,
} from '../../domain/entities';

function ok<T>(res: Response, status: number, data: T): void {
    res.status(status).json({ ok: true, data } satisfies ApiSuccessResponse<T>);
}

export class TutorController {
    constructor(
        private readonly deps: {
            listConversations: ListConversationsUseCase;
            getConversation: GetConversationUseCase;
            createConversation: CreateConversationUseCase;
            sendMessage: SendMessageUseCase;
            deleteConversation: DeleteConversationUseCase;
            listDecks: ListDecksUseCase;
            getDeckWithCards: GetDeckWithCardsUseCase;
            generateDeck: GenerateDeckUseCase;
            deleteDeck: DeleteDeckUseCase;
            submitReview: SubmitReviewUseCase;
            listEpisodes: ListEpisodesUseCase;
            getEpisode: GetEpisodeUseCase;
            getProgress: GetProgressUseCase;
            saveProgress: SaveProgressUseCase;
            listSummaries: ListSummariesUseCase;
            getSummary: GetSummaryUseCase;
            getCursoId: GetCursoIdUseCase;
            generatePodcast: GeneratePodcastUseCase;
            proxyPodcastAudio?: ProxyPodcastAudioUseCase;
        },
    ) {}

    // ── Chat ──────────────────────────────────────────────────────────────────

    listConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const list = await this.deps.listConversations.execute(req.authUser!.id);
            ok(res, 200, list.map(this.serializeConversation));
        } catch (err) { next(err); }
    };

    getConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { conversation, messages } = await this.deps.getConversation.execute(
                (req.params.id as string),
                req.authUser!.id,
            );
            ok(res, 200, { conversation: this.serializeConversation(conversation), messages: messages.map(this.serializeMessage) });
        } catch (err) { next(err); }
    };

    createConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { title, topic } = req.body as { title: string; topic: string | null };
            const conv = await this.deps.createConversation.execute({ userId: req.authUser!.id, title, topic });
            ok(res, 201, this.serializeConversation(conv));
        } catch (err) { next(err); }
    };

    sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { content, personality, tonePrefs } = req.body as {
                content: string;
                personality?: string;
                // Preferencias OPOX enviadas por el mobile (formato AsyncStorage)
                tonePrefs?: {
                    personality?: string;
                    detailLevel?: number;
                    hintStyle?: string;
                    reinforcementLevel?: string;
                };
            };

            // Convertir preferencias OPOX al formato que espera el Motor IA
            const toneProfile = tonePrefs
                ? buildToneProfile({
                    personality: (tonePrefs.personality ?? 'cercano') as import('../../domain/entities').TonePersonality,
                    detailLevel: (tonePrefs.detailLevel ?? 1) as import('../../domain/entities').DetailLevel,
                    hintStyle: (tonePrefs.hintStyle ?? 'directas') as import('../../domain/entities').HintStyle,
                    reinforcementLevel: (tonePrefs.reinforcementLevel ?? 'normal') as import('../../domain/entities').ReinforcementLevel,
                    theme: 'auto',
                    fontScale: 1.0,
                    reduceMotion: false,
                    userId: req.authUser!.id,
                    updatedAt: new Date(),
                })
                : undefined;

            const cursoId = await this.deps.getCursoId.execute(req.authUser!.oposicion);
            const { userMessage, aiMessage } = await this.deps.sendMessage.execute({
                conversationId: (req.params.id as string),
                userId: req.authUser!.id,
                content,
                cursoId,
                personality,
                toneProfile,
            });
            ok(res, 201, { userMessage: this.serializeMessage(userMessage), aiMessage: this.serializeMessage(aiMessage) });
        } catch (err) { next(err); }
    };

    deleteConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.deps.deleteConversation.execute((req.params.id as string), req.authUser!.id);
            ok(res, 200, null);
        } catch (err) { next(err); }
    };

    // ── Flashcards ────────────────────────────────────────────────────────────

    listDecks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const list = await this.deps.listDecks.execute(req.authUser!.id);
            ok(res, 200, list.map(this.serializeDeck));
        } catch (err) { next(err); }
    };

    getDeck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { deck, cards } = await this.deps.getDeckWithCards.execute((req.params.id as string), req.authUser!.id);
            ok(res, 200, { deck: this.serializeDeck(deck), cards: cards.map(this.serializeCard) });
        } catch (err) { next(err); }
    };

    generateDeck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { topicId, topicTitle, oposicion } = req.body as { topicId: string; topicTitle: string; oposicion: string };
            const cursoId = await this.deps.getCursoId.execute(oposicion);
            const { deck, cards } = await this.deps.generateDeck.execute({ userId: req.authUser!.id, topicId, topicTitle, oposicion, cursoId });
            ok(res, 201, { deck: this.serializeDeck(deck), cards: cards.map(this.serializeCard) });
        } catch (err) { next(err); }
    };

    deleteDeck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.deps.deleteDeck.execute((req.params.id as string), req.authUser!.id);
            ok(res, 200, null);
        } catch (err) { next(err); }
    };

    submitReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { knownCount, failedCount, failedCardIds } = req.body as { knownCount: number; failedCount: number; failedCardIds: string[] };
            await this.deps.submitReview.execute({ userId: req.authUser!.id, deckId: (req.params.id as string), knownCount, failedCount, failedCardIds });
            ok(res, 200, null);
        } catch (err) { next(err); }
    };

    // ── Podcast ───────────────────────────────────────────────────────────────

    listEpisodes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { oposicion } = req.validatedQuery as { oposicion: string };
            const list = await this.deps.listEpisodes.execute(oposicion);
            ok(res, 200, list.map(this.serializeEpisode));
        } catch (err) { next(err); }
    };

    getEpisode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const episode = await this.deps.getEpisode.execute((req.params.id as string));
            ok(res, 200, this.serializeEpisode(episode));
        } catch (err) { next(err); }
    };

    getProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const progress = await this.deps.getProgress.execute(req.authUser!.id, (req.params.episodeId as string));
            ok(res, 200, progress ? this.serializeProgress(progress) : null);
        } catch (err) { next(err); }
    };

    saveProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { positionSecs } = req.body as { positionSecs: number };
            const progress = await this.deps.saveProgress.execute({ userId: req.authUser!.id, episodeId: (req.params.episodeId as string), positionSecs });
            ok(res, 200, this.serializeProgress(progress));
        } catch (err) { next(err); }
    };

    // Proxy stream del mp3 del Motor. Ruta pública — el filename es un hash aleatorio
    // (podcast-[a-f0-9]{16,32}.mp3) que actúa como secreto compartido: solo lo conoce
    // quien acaba de generar el podcast. Validamos el patrón para evitar path traversal
    // y llamadas al Motor con paths arbitrarios.
    proxyPodcastAudio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!this.deps.proxyPodcastAudio) {
                res.status(503).json({ ok: false, error: { code: 'motor-not-configured', message: 'Motor IA no configurado' } });
                return;
            }
            const filename = (req.params.filename as string);
            if (!/^podcast-[a-f0-9]{8,64}\.mp3$/.test(filename)) {
                res.status(400).json({ ok: false, error: { code: 'invalid-filename', message: 'Filename inválido' } });
                return;
            }
            const upstream = await this.deps.proxyPodcastAudio.execute(filename);
            if (upstream.status !== 200 || !upstream.body) {
                res.status(upstream.status).end();
                return;
            }
            res.setHeader('Content-Type', upstream.contentType);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            // Stream chunks del web-standard ReadableStream a Express (Node stream).
            const reader = upstream.body.getReader();
            const pump = async (): Promise<void> => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) res.write(Buffer.from(value));
                }
                res.end();
            };
            await pump();
        } catch (err) { next(err); }
    };

    generatePodcast = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { topicId, topicTitle, oposicion, duracion, velocidad } = req.body as {
                topicId: string;
                topicTitle: string;
                oposicion: string;
                duracion?: 'corta' | 'media';
                velocidad?: number;
            };
            const cursoId = await this.deps.getCursoId.execute(oposicion);
            const r = await this.deps.generatePodcast.execute({
                topicId,
                topicTitle,
                userId: req.authUser!.id,
                cursoId,
                duracion,
                velocidad,
            });
            // Devolvemos filename al mobile — el mobile construye la URL final
            // `${API_BASE_URL}/tutor/podcast/audio/{filename}` que hace stream vía proxy.
            ok(res, 200, r);
        } catch (err) { next(err); }
    };

    // ── Resúmenes ─────────────────────────────────────────────────────────────

    listSummaries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { oposicion } = req.validatedQuery as { oposicion: string };
            const list = await this.deps.listSummaries.execute(oposicion);
            ok(res, 200, list.map(this.serializeSummary));
        } catch (err) { next(err); }
    };

    getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { oposicion, detailLevel } = req.validatedQuery as { oposicion: string; detailLevel?: number };
            const cursoId = await this.deps.getCursoId.execute(oposicion);
            const summary = await this.deps.getSummary.execute((req.params.topicId as string), oposicion, cursoId, detailLevel);
            ok(res, 200, this.serializeSummary(summary));
        } catch (err) { next(err); }
    };

    // ── Serializers ───────────────────────────────────────────────────────────

    private serializeConversation(c: TutorConversation): TutorConversationDTO {
        return {
            id: c.id,
            title: c.title,
            topic: c.topic,
            lastMessage: c.lastMessage,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
        };
    }

    private serializeMessage(m: TutorMessage): TutorMessageDTO {
        return {
            id: m.id,
            conversationId: m.conversationId,
            isAI: m.isAI,
            content: m.content,
            suggestedActions: m.suggestedActions,
            createdAt: m.createdAt.toISOString(),
        };
    }

    private serializeDeck(d: TutorFlashcardDeck): TutorFlashcardDeckDTO {
        return {
            id: d.id,
            topicId: d.topicId,
            topicTitle: d.topicTitle,
            oposicion: d.oposicion,
            cardCount: d.cardCount,
            createdAt: d.createdAt.toISOString(),
        };
    }

    private serializeCard(c: TutorFlashcard): TutorFlashcardDTO {
        return {
            id: c.id,
            deckId: c.deckId,
            question: c.question,
            answer: c.answer,
            easeFactor: c.easeFactor,
            intervalDays: c.intervalDays,
            nextReviewAt: c.nextReviewAt?.toISOString() ?? null,
        };
    }

    private serializeEpisode(e: TutorPodcastEpisode): TutorPodcastEpisodeDTO {
        return {
            id: e.id,
            oposicion: e.oposicion,
            topicId: e.topicId,
            title: e.title,
            totalSeconds: e.totalSeconds,
            createdAt: e.createdAt.toISOString(),
        };
    }

    private serializeProgress(p: TutorPodcastProgress): TutorPodcastProgressDTO {
        return {
            episodeId: p.episodeId,
            positionSecs: p.positionSecs,
            updatedAt: p.updatedAt.toISOString(),
        };
    }

    private serializeSummary(s: TutorSummary): TutorSummaryDTO {
        return {
            topicId: s.topicId,
            topicTitle: s.topicTitle,
            oposicion: s.oposicion,
            sections: s.sections,
            updatedAt: s.updatedAt.toISOString(),
        };
    }
}
