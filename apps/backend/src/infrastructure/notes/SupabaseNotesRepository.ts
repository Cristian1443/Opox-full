import type { SupabaseClient } from '@supabase/supabase-js';
import type { INotesRepository } from '../../domain';
import type {
    Note,
    NotePage,
    NoteTag,
    NoteQuestion,
    NoteStatus,
    NoteAnalysisErrorCode,
} from '../../domain/entities';
import { logger } from '@opox/utils';

export class SupabaseNotesRepository implements INotesRepository {
    constructor(private readonly db: SupabaseClient) {}

    // ── Listado y detalle ────────────────────────────────────────────────────

    async listNotes(userId: string): Promise<Note[]> {
        const { data, error } = await this.db
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) { logger.error('[notes-repo] listNotes', { error }); return []; }
        return (data ?? []).map(mapNote);
    }

    async getNote(id: string, userId: string): Promise<Note | null> {
        const { data, error } = await this.db
            .from('notes')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();
        if (error) { logger.error('[notes-repo] getNote', { error }); return null; }
        return data ? mapNote(data) : null;
    }

    async getNotePages(noteId: string, userId: string): Promise<NotePage[]> {
        const { data, error } = await this.db
            .from('note_pages')
            .select('*')
            .eq('note_id', noteId)
            .eq('user_id', userId)
            .order('page_number', { ascending: true });
        if (error) { logger.error('[notes-repo] getNotePages', { error }); return []; }
        return (data ?? []).map(mapPage);
    }

    async getNoteTags(noteId: string, userId: string): Promise<NoteTag[]> {
        const { data, error } = await this.db
            .from('note_tags')
            .select('*')
            .eq('note_id', noteId)
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        if (error) { logger.error('[notes-repo] getNoteTags', { error }); return []; }
        return (data ?? []).map(mapTag);
    }

    // ── Subida a Storage ─────────────────────────────────────────────────────

    async uploadFile(params: {
        userId: string;
        noteId: string;
        fileName: string;
        base64: string;
        mimeType: string;
    }): Promise<string> {
        const storagePath = `${params.userId}/${params.noteId}/${params.fileName}`;
        const fileBuffer  = new Uint8Array(Buffer.from(params.base64, 'base64'));

        const { error } = await this.db.storage
            .from('notes')
            .upload(storagePath, fileBuffer, {
                contentType: params.mimeType,
                upsert: true,
            });

        if (error) {
            logger.error('[notes-repo] uploadFile', { error, storagePath });
            throw error;
        }
        return storagePath;
    }

    // ── Creación ─────────────────────────────────────────────────────────────

    async createNote(input: {
        userId: string;
        title: string;
        fileName: string;
        kind: 'pdf' | 'photo';
        pages: number;
        storagePath: string | null;
    }): Promise<Note> {
        const { data, error } = await this.db
            .from('notes')
            .insert({
                user_id: input.userId,
                title: input.title,
                file_name: input.fileName,
                kind: input.kind,
                pages: input.pages,
                storage_path: input.storagePath,
            })
            .select('*')
            .single();
        if (error || !data) {
            logger.error('[notes-repo] createNote', { error });
            throw error ?? new Error('createNote returned no row');
        }
        return mapNote(data);
    }

    // ── Actualización del pipeline ───────────────────────────────────────────

    async updateStatus(
        id: string,
        userId: string,
        patch: {
            status?: NoteStatus;
            progress?: number;
            errorCode?: NoteAnalysisErrorCode | null;
            errorMessage?: string | null;
            questionsCount?: number;
            storagePath?: string | null;
        },
    ): Promise<void> {
        const dbPatch: Record<string, unknown> = {};
        if (patch.status !== undefined) dbPatch.status = patch.status;
        if (patch.progress !== undefined) dbPatch.progress = patch.progress;
        if (patch.errorCode !== undefined) dbPatch.error_code = patch.errorCode;
        if (patch.errorMessage !== undefined) dbPatch.error_message = patch.errorMessage;
        if (patch.questionsCount !== undefined) dbPatch.questions_count = patch.questionsCount;
        if (patch.storagePath !== undefined) dbPatch.storage_path = patch.storagePath;
        if (patch.pages !== undefined) dbPatch.pages = patch.pages;

        const { error } = await this.db
            .from('notes')
            .update(dbPatch)
            .eq('id', id)
            .eq('user_id', userId);
        if (error) logger.error('[notes-repo] updateStatus', { error });
    }

    // ── Páginas ──────────────────────────────────────────────────────────────

    async addPage(input: {
        noteId: string;
        userId: string;
        pageNumber: number;
        thumbnailUrl: string | null;
        extractedText: string | null;
        ocrConfidence: number;
    }): Promise<NotePage> {
        const { data, error } = await this.db
            .from('note_pages')
            .upsert({
                note_id: input.noteId,
                user_id: input.userId,
                page_number: input.pageNumber,
                thumbnail_url: input.thumbnailUrl,
                extracted_text: input.extractedText,
                ocr_confidence: input.ocrConfidence,
            }, { onConflict: 'note_id,page_number' })
            .select('*')
            .single();
        if (error || !data) {
            logger.error('[notes-repo] addPage', { error });
            throw error ?? new Error('addPage returned no row');
        }
        return mapPage(data);
    }

    // ── Etiquetas ────────────────────────────────────────────────────────────

    async setTags(
        noteId: string,
        userId: string,
        tags: Array<{ label: string; source: 'ai' | 'user' }>,
    ): Promise<NoteTag[]> {
        // Sustitución completa: borrar los previos, insertar los nuevos.
        // Simple y correcto para volúmenes bajos (< 20 tags por apunte).
        const { error: delErr } = await this.db
            .from('note_tags')
            .delete()
            .eq('note_id', noteId)
            .eq('user_id', userId);
        if (delErr) logger.error('[notes-repo] setTags delete', { error: delErr });

        if (tags.length === 0) return [];

        const rows = tags.map(t => ({
            note_id: noteId,
            user_id: userId,
            label: t.label,
            source: t.source,
        }));
        const { data, error } = await this.db
            .from('note_tags')
            .insert(rows)
            .select('*');
        if (error) { logger.error('[notes-repo] setTags insert', { error }); return []; }
        return (data ?? []).map(mapTag);
    }

    // ── Preguntas ────────────────────────────────────────────────────────────

    async addQuestions(input: {
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
    }): Promise<NoteQuestion[]> {
        if (input.questions.length === 0) return [];
        const rows = input.questions.map(q => ({
            note_id: input.noteId,
            user_id: input.userId,
            text: q.text,
            options: q.options,
            correct_index: q.correctIndex,
            explanation: q.explanation ?? null,
            tag: q.tag ?? null,
            difficulty: q.difficulty ?? null,
        }));
        const { data, error } = await this.db
            .from('note_questions')
            .insert(rows)
            .select('*');
        if (error) { logger.error('[notes-repo] addQuestions', { error }); return []; }
        return (data ?? []).map(mapQuestion);
    }

    async listQuestions(
        noteId: string,
        userId: string,
        filter?: { tags?: string[]; limit?: number },
    ): Promise<NoteQuestion[]> {
        let q = this.db
            .from('note_questions')
            .select('*')
            .eq('note_id', noteId)
            .eq('user_id', userId);
        if (filter?.tags?.length) q = q.in('tag', filter.tags);
        if (filter?.limit) q = q.limit(filter.limit);
        const { data, error } = await q;
        if (error) { logger.error('[notes-repo] listQuestions', { error }); return []; }
        return (data ?? []).map(mapQuestion);
    }

    // ── Borrado ──────────────────────────────────────────────────────────────

    async deleteNote(id: string, userId: string): Promise<void> {
        // ON DELETE CASCADE se encarga de note_pages/tags/questions.
        const { error } = await this.db
            .from('notes')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) logger.error('[notes-repo] deleteNote', { error });
    }

    // ── Stats agregadas ──────────────────────────────────────────────────────

    async getStats(userId: string): Promise<{
        totalNotes: number;
        totalQuestions: number;
        anyProcessing: boolean;
        anyError: boolean;
    }> {
        // Un solo select con lo mínimo y contamos en memoria (volúmenes bajos por usuario).
        const { data, error } = await this.db
            .from('notes')
            .select('status, questions_count')
            .eq('user_id', userId);
        if (error || !data) {
            logger.error('[notes-repo] getStats', { error });
            return { totalNotes: 0, totalQuestions: 0, anyProcessing: false, anyError: false };
        }
        const processingStates = new Set(['processing_ocr', 'processing_topics', 'processing_questions']);
        return {
            totalNotes: data.length,
            totalQuestions: data.reduce((sum, r) => sum + (r.questions_count ?? 0), 0),
            anyProcessing: data.some(r => processingStates.has(r.status)),
            anyError: data.some(r => r.status === 'error'),
        };
    }
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function mapNote(r: any): Note {
    return {
        id: r.id,
        userId: r.user_id,
        title: r.title,
        fileName: r.file_name,
        kind: r.kind,
        pages: r.pages,
        status: r.status,
        progress: r.progress,
        errorCode: r.error_code,
        errorMessage: r.error_message,
        storagePath: r.storage_path,
        questionsCount: r.questions_count,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
    };
}

function mapPage(r: any): NotePage {
    return {
        id: r.id,
        noteId: r.note_id,
        userId: r.user_id,
        pageNumber: r.page_number,
        thumbnailUrl: r.thumbnail_url,
        extractedText: r.extracted_text,
        ocrConfidence: Number(r.ocr_confidence),
        createdAt: new Date(r.created_at),
    };
}

function mapTag(r: any): NoteTag {
    return {
        id: r.id,
        noteId: r.note_id,
        userId: r.user_id,
        label: r.label,
        source: r.source,
        createdAt: new Date(r.created_at),
    };
}

function mapQuestion(r: any): NoteQuestion {
    return {
        id: r.id,
        noteId: r.note_id,
        userId: r.user_id,
        text: r.text,
        options: r.options,
        correctIndex: r.correct_index,
        explanation: r.explanation,
        tag: r.tag,
        difficulty: r.difficulty,
        createdAt: new Date(r.created_at),
    };
}
