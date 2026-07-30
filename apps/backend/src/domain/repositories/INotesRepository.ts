import type {
    Note,
    NotePage,
    NoteTag,
    NoteQuestion,
    NoteStatus,
    NoteAnalysisErrorCode,
} from '../entities';

/**
 * Contrato del repositorio de la Factoría de Apuntes.
 * Implementado por SupabaseNotesRepository en infrastructure/.
 */
export interface INotesRepository {
    // ── Listado y detalle ───────────────────────────────────────────────────
    listNotes(userId: string): Promise<Note[]>;
    getNote(id: string, userId: string): Promise<Note | null>;
    getNotePages(noteId: string, userId: string): Promise<NotePage[]>;
    getNoteTags(noteId: string, userId: string): Promise<NoteTag[]>;

    // ── Creación / subida ───────────────────────────────────────────────────
    createNote(data: {
        userId: string;
        title: string;
        fileName: string;
        kind: 'pdf' | 'photo';
        pages: number;
        storagePath: string | null;
    }): Promise<Note>;

    // ── Actualización del pipeline ──────────────────────────────────────────
    updateStatus(
        id: string,
        userId: string,
        patch: {
            status?: NoteStatus;
            progress?: number;
            errorCode?: NoteAnalysisErrorCode | null;
            errorMessage?: string | null;
            questionsCount?: number;
        },
    ): Promise<void>;

    // ── Páginas ─────────────────────────────────────────────────────────────
    addPage(data: {
        noteId: string;
        userId: string;
        pageNumber: number;
        thumbnailUrl: string | null;
        extractedText: string | null;
        ocrConfidence: number;
    }): Promise<NotePage>;

    // ── Etiquetas ───────────────────────────────────────────────────────────
    setTags(noteId: string, userId: string, tags: Array<{
        label: string;
        source: 'ai' | 'user';
    }>): Promise<NoteTag[]>;

    // ── Preguntas generadas ─────────────────────────────────────────────────
    addQuestions(data: {
        noteId: string;
        userId: string;
        questions: Array<{
            text: string;
            options: string[];
            correctIndex: number;
            explanation?: string;
            tag?: string;
            difficulty?: 'easy' | 'medium' | 'hard';
        }>;
    }): Promise<NoteQuestion[]>;

    listQuestions(
        noteId: string,
        userId: string,
        filter?: { tags?: string[]; limit?: number },
    ): Promise<NoteQuestion[]>;

    // ── Borrado ─────────────────────────────────────────────────────────────
    deleteNote(id: string, userId: string): Promise<void>;

    // ── Stats agregadas para 9.1 ────────────────────────────────────────────
    getStats(userId: string): Promise<{
        totalNotes: number;
        totalQuestions: number;
        anyProcessing: boolean;
        anyError: boolean;
    }>;
}
