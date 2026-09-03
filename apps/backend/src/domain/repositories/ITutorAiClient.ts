import type { ToneProfile } from '../entities';

export interface TutorAiChatParams {
    message: string;
    toneProfile?: ToneProfile;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    topic?: string | null;
}

export interface TutorAiChatResult {
    content: string;
    suggestedActions?: Array<{ label: string; icon: string }>;
}

/** Contrato mínimo que el Motor IA (u otro proveedor) debe implementar para el Aula Virtual. */
export interface ITutorAiClient {
    chat(params: TutorAiChatParams): Promise<TutorAiChatResult>;

    generateFlashcards(params: {
        topicId: string;
        topicTitle: string;
        oposicion: string;
        count?: number;
    }): Promise<Array<{ question: string; answer: string }>>;

    getSummary(params: {
        topicId: string;
        oposicion: string;
    }): Promise<Array<{ title: string; content: string }>>;
}
