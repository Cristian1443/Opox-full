import type { ToneProfile } from '../entities';

export interface TutorAiChatParams {
    message: string;
    userId?: string;
    /** ID del curso en el Motor IA (tabla training_courses). Opcional — fallback al defaultCursoId. */
    cursoId?: string;
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
        /** ID del curso en el Motor IA (tabla training_courses). Opcional — fallback al defaultCursoId. */
        cursoId?: string;
        count?: number;
    }): Promise<Array<{ question: string; answer: string }>>;

    getSummary(params: {
        topicId: string;
        oposicion: string;
        /** ID del curso en el Motor IA (tabla training_courses). Opcional — fallback al defaultCursoId. */
        cursoId?: string;
        /** 0=esquema, 1=medio, 2=profundo. Default: 1. */
        detailLevel?: number;
    }): Promise<Array<{ title: string; content: string }>>;

    /** Genera un podcast del tema vía Motor async (dispara job, hace polling y devuelve URL del mp3). */
    generatePodcast?(params: {
        topicId: string;
        /** user_id — el Motor lo exige en el body para tracking del job. */
        userId: string;
        cursoId?: string;
        /** 'corta' (5 min) | 'media' (10 min). Default: 'media'. */
        duracion?: 'corta' | 'media';
        /** 0.5 | 1.0 | 1.5 | 2.0. Default: 1.0. */
        velocidad?: number;
    }): Promise<{
        filename: string;
        /** URL completa del mp3 (baseUrl + path del Motor). */
        mp3Url: string;
        estimatedSeconds: number;
    }>;
}
