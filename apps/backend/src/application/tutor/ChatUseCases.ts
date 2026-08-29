import type { ITutorRepository } from '../../domain';
import { ConversationNotFoundError } from '../../domain';
import type { TutorConversation, TutorMessage } from '../../domain/entities';

// ─── Stub de respuesta IA ─────────────────────────────────────────────────────
// TODO(ia-bloque8): reemplazar con TutorAiContract.generateChatResponse()
const DEFAULT_SUGGESTED_ACTIONS: Array<{ label: string; icon: string }> = [
    { label: 'Crear flashcards', icon: 'layers-outline' },
    { label: 'Ponme un ejemplo', icon: 'bulb-outline' },
    { label: 'Lanzar test', icon: 'flash-outline' },
];

function buildStubAiResponse(_userContent: string): { content: string; suggestedActions: Array<{ label: string; icon: string }> } {
    return {
        content: 'Entendido. Voy a preparar la explicación de este tema según tu temario. En la versión con IA activa, recibirás aquí una respuesta personalizada con referencias a los artículos y normativa relevante.',
        suggestedActions: DEFAULT_SUGGESTED_ACTIONS,
    };
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

// ─── Enviar mensaje (persiste + genera respuesta stub) ────────────────────────
export class SendMessageUseCase {
    constructor(private readonly tutorRepo: ITutorRepository) {}

    async execute(params: {
        conversationId: string;
        userId: string;
        content: string;
    }): Promise<{ userMessage: TutorMessage; aiMessage: TutorMessage }> {
        const conversation = await this.tutorRepo.getConversation(params.conversationId, params.userId);
        if (!conversation) throw new ConversationNotFoundError();

        const userMessage = await this.tutorRepo.addMessage({
            conversationId: params.conversationId,
            userId: params.userId,
            role: 'user',
            content: params.content,
        });

        // TODO(ia-bloque8): sustituir buildStubAiResponse por TutorAiContract.generateChatResponse()
        const { content: aiContent, suggestedActions } = buildStubAiResponse(params.content);
        const aiMessage = await this.tutorRepo.addMessage({
            conversationId: params.conversationId,
            userId: params.userId,
            role: 'assistant',
            content: aiContent,
            suggestedActions,
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
