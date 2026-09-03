import { logger } from '@opox/utils';
import type { ITutorRepository } from '../../domain';
import { ConversationNotFoundError } from '../../domain';
import type { ITutorAiClient } from '../../domain/repositories/ITutorAiClient';
import type { TutorConversation, TutorMessage } from '../../domain/entities';
import type { ToneProfile } from '../../domain/entities';

// ─── Stub de respuesta IA (fallback sin Motor) ────────────────────────────────
const DEFAULT_SUGGESTED_ACTIONS: Array<{ label: string; icon: string }> = [
    { label: 'Crear flashcards', icon: 'layers-outline' },
    { label: 'Ponme un ejemplo', icon: 'bulb-outline' },
    { label: 'Lanzar test', icon: 'flash-outline' },
];

function buildStubAiResponse(personality: string = 'equilibrado'): { content: string; suggestedActions: Array<{ label: string; icon: string }> } {
    let content: string;
    if (personality === 'cercano' || personality === 'motivador') {
        content = '¡Claro que sí! Voy a explicarte este tema de forma sencilla. En la versión con IA activa, recibirás una respuesta personalizada con referencias a los artículos y normativa relevante. ¡Cualquier duda, me dices!';
    } else if (personality === 'directo') {
        content = 'Entendido. En la versión con IA activa, recibirás aquí la explicación directa con referencias normativas.';
    } else {
        content = 'Entendido. Voy a preparar la explicación de este tema según tu temario. En la versión con IA activa, recibirás aquí una respuesta personalizada con referencias a los artículos y normativa relevante.';
    }
    return { content, suggestedActions: DEFAULT_SUGGESTED_ACTIONS };
}

// ─── Listar conversaciones ────────────────────────────────────────────────────
export class ListConversationsUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(userId: string): Promise<TutorConversation[]> {
        return this.tutorRepo.listConversations(userId);
    }
}

// ─── Obtener conversación con mensajes ────────────────────────────────────────
export class GetConversationUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(id: string, userId: string): Promise<{ conversation: TutorConversation; messages: TutorMessage[] }> {
        const conversation = await this.tutorRepo.getConversation(id, userId);
        if (!conversation) throw new ConversationNotFoundError();
        const messages = await this.tutorRepo.listMessages(id, userId);
        return { conversation, messages };
    }
}

// ─── Crear conversación ───────────────────────────────────────────────────────
export class CreateConversationUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(params: { userId: string; title: string; topic: string | null }): Promise<TutorConversation> {
        return this.tutorRepo.createConversation(params);
    }
}

// ─── Enviar mensaje (persiste + genera respuesta IA) ──────────────────────────
export class SendMessageUseCase {
    constructor(
        private readonly tutorRepo: ITutorRepository,
        private readonly tutorAi?: ITutorAiClient,
    ) {}

    async execute(params: {
        conversationId: string;
        userId: string;
        content: string;
        personality?: string;
        toneProfile?: ToneProfile;
    }): Promise<{ userMessage: TutorMessage; aiMessage: TutorMessage }> {
        const conversation = await this.tutorRepo.getConversation(params.conversationId, params.userId);
        if (!conversation) throw new ConversationNotFoundError();

        const userMessage = await this.tutorRepo.addMessage({
            conversationId: params.conversationId,
            userId: params.userId,
            role: 'user',
            content: params.content,
        });

        let aiContent: string;
        let suggestedActions: Array<{ label: string; icon: string }> | undefined;

        if (this.tutorAi) {
            try {
                // Obtener historial reciente para dar contexto al Motor
                const allMessages = await this.tutorRepo.listMessages(params.conversationId, params.userId);
                const history = allMessages
                    .slice(-11, -1) // últimos 10 mensajes antes del actual
                    .map((m) => ({ role: m.isAI ? 'assistant' as const : 'user' as const, content: m.content }));

                const result = await this.tutorAi.chat({
                    message: params.content,
                    toneProfile: params.toneProfile,
                    history,
                    topic: conversation.topic,
                });
                aiContent = result.content;
                suggestedActions = result.suggestedActions ?? DEFAULT_SUGGESTED_ACTIONS;
            } catch (err) {
                logger.warn('[SendMessage] Motor falló, usando stub', { err: String(err) });
                const stub = buildStubAiResponse(params.personality);
                aiContent = stub.content;
                suggestedActions = stub.suggestedActions;
            }
        } else {
            const stub = buildStubAiResponse(params.personality);
            aiContent = stub.content;
            suggestedActions = stub.suggestedActions;
        }

        const aiMessage = await this.tutorRepo.addMessage({
            conversationId: params.conversationId,
            userId: params.userId,
            role: 'assistant',
            content: aiContent,
            suggestedActions: suggestedActions ?? null,
        });

        return { userMessage, aiMessage };
    }
}

// ─── Eliminar conversación ────────────────────────────────────────────────────
export class DeleteConversationUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(id: string, userId: string): Promise<void> {
        const conversation = await this.tutorRepo.getConversation(id, userId);
        if (!conversation) throw new ConversationNotFoundError();
        await this.tutorRepo.deleteConversation(id, userId);
    }
}
