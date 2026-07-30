import type { INotesRepository, Note, NotePage, NoteTag } from '../../domain';
import { NoteNotFoundError, NoteInvalidFormatError, NoteNotReadyError } from '../../domain';
import type { AiApiContract } from '@opox/types';

// ─── Constantes de validación (espejo de las del móvil) ─────────────────────
const ACCEPTED_MIME = [
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf',
];
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB por archivo

function isAcceptedFile(mimeType: string): boolean {
    return ACCEPTED_MIME.includes(mimeType.toLowerCase());
}

// ─── Listado 9.1 ────────────────────────────────────────────────────────────
export class ListNotesUseCase {
    constructor(private readonly repo: INotesRepository) {}
    async execute(userId: string): Promise<{
        stats: {
            totalNotes: number;
            totalQuestions: number;
            ingestStatus: 'ok' | 'processing' | 'error';
        };
        notes: Note[];
    }> {
        const [notes, stats] = await Promise.all([
            this.repo.listNotes(userId),
            this.repo.getStats(userId),
        ]);
        const ingestStatus = stats.anyError
            ? 'error'
            : stats.anyProcessing
                ? 'processing'
                : 'ok';
        return {
            stats: {
                totalNotes: stats.totalNotes,
                totalQuestions: stats.totalQuestions,
                ingestStatus,
            },
            notes,
        };
    }
}

// ─── Detalle 9.4 ────────────────────────────────────────────────────────────
export class GetNoteUseCase {
    constructor(private readonly repo: INotesRepository) {}
    async execute(id: string, userId: string): Promise<{
        note: Note;
        pages: NotePage[];
        tags: NoteTag[];
    }> {
        const note = await this.repo.getNote(id, userId);
        if (!note) throw new NoteNotFoundError();
        const [pages, tags] = await Promise.all([
            this.repo.getNotePages(id, userId),
            this.repo.getNoteTags(id, userId),
        ]);
        return { note, pages, tags };
    }
}

// ─── Subida y arranque de análisis 9.2/9.3 ──────────────────────────────────
// Valida el archivo, crea la fila con status='processing_ocr' y dispara el
// pipeline IA en background. Devuelve el noteId para que el móvil haga polling.
export class UploadNoteUseCase {
    constructor(
        private readonly repo: INotesRepository,
        private readonly ai: AiApiContract,
    ) {}

    async execute(params: {
        userId: string;
        oposicion: string;
        kind: 'pdf' | 'photo';
        fileName: string;
        files: Array<{ base64: string; mimeType: string; sizeBytes: number }>;
    }): Promise<{ noteId: string; status: 'processing_ocr' }> {
        if (params.files.length === 0) throw new NoteInvalidFormatError();
        for (const f of params.files) {
            if (!isAcceptedFile(f.mimeType)) throw new NoteInvalidFormatError();
            if (f.sizeBytes > MAX_FILE_BYTES) {
                // Se podría lanzar NoteFileTooLargeError pero mantenemos consistencia
                // con el mensaje mostrado en el móvil.
                throw new NoteInvalidFormatError();
            }
        }

        const note = await this.repo.createNote({
            userId: params.userId,
            title: params.fileName.replace(/\.[^.]+$/, ''),
            fileName: params.fileName,
            kind: params.kind,
            pages: params.files.length,
            storagePath: null, // TODO(bloque9): subir a Supabase Storage y guardar path.
        });

        // Arrancamos el pipeline en background — no bloqueamos la respuesta.
        // En una versión con colas esto pasaría a un job worker (BullMQ, etc.).
        void runAnalysisPipeline({ note, files: params.files, oposicion: params.oposicion }, this.repo, this.ai)
            .catch(() => {
                // El pipeline persiste sus propios errores en updateStatus,
                // así que un throw aquí solo lo tragamos para no matar el proceso.
            });

        return { noteId: note.id, status: 'processing_ocr' };
    }
}

// ─── Status del análisis (polling desde 9.3) ────────────────────────────────
export class GetNoteStatusUseCase {
    constructor(private readonly repo: INotesRepository) {}

    async execute(id: string, userId: string): Promise<{
        noteId: string;
        status: Note['status'];
        progress: number;
        pagesDone: number;
        topicsFound: number;
        questionsGenerated: number;
        errorCode: string | null;
        errorMessage: string | null;
        pagesWithLowConfidence: number[];
    }> {
        const note = await this.repo.getNote(id, userId);
        if (!note) throw new NoteNotFoundError();
        const [pages, tags] = await Promise.all([
            this.repo.getNotePages(id, userId),
            this.repo.getNoteTags(id, userId),
        ]);
        const lowConfidence = pages
            .filter(p => p.ocrConfidence < 0.6)
            .map(p => p.pageNumber);
        return {
            noteId: note.id,
            status: note.status,
            progress: note.progress,
            pagesDone: pages.length,
            topicsFound: tags.length,
            questionsGenerated: note.questionsCount,
            errorCode: note.errorCode,
            errorMessage: note.errorMessage,
            pagesWithLowConfidence: lowConfidence,
        };
    }
}

// ─── Edición de etiquetas (9.4 modal) ───────────────────────────────────────
export class UpdateNoteTagsUseCase {
    constructor(private readonly repo: INotesRepository) {}

    async execute(id: string, userId: string, labels: string[]): Promise<NoteTag[]> {
        const note = await this.repo.getNote(id, userId);
        if (!note) throw new NoteNotFoundError();
        return this.repo.setTags(id, userId, labels.map(label => ({ label, source: 'user' as const })));
    }
}

// ─── Borrar apunte (9.4 confirm) ────────────────────────────────────────────
export class DeleteNoteUseCase {
    constructor(private readonly repo: INotesRepository) {}
    async execute(id: string, userId: string): Promise<void> {
        const note = await this.repo.getNote(id, userId);
        if (!note) throw new NoteNotFoundError();
        await this.repo.deleteNote(id, userId);
    }
}

// ─── Generar test desde apunte (9.5 → runner del Bloque 7) ──────────────────
export class GenerateTestFromNoteUseCase {
    constructor(private readonly repo: INotesRepository) {}

    async execute(params: {
        id: string;
        userId: string;
        questionCount: number;
        topics: string[];
    }): Promise<{
        questions: Array<{
            id: string;
            text: string;
            options: string[];
            correctIndex: number;
            topicId?: string;
            difficulty?: 'easy' | 'medium' | 'hard';
        }>;
    }> {
        const note = await this.repo.getNote(params.id, params.userId);
        if (!note) throw new NoteNotFoundError();
        if (note.status !== 'ready') throw new NoteNotReadyError();

        const raw = await this.repo.listQuestions(params.id, params.userId, {
            tags: params.topics,
            limit: params.questionCount,
        });
        return {
            questions: raw.map(q => ({
                id: q.id,
                text: q.text,
                options: q.options,
                correctIndex: q.correctIndex,
                topicId: q.tag ?? undefined,
                difficulty: q.difficulty ?? undefined,
            })),
        };
    }
}

// ─── Pipeline de análisis IA (helper interno) ───────────────────────────────
// Orquesta OCR → tags → preguntas actualizando `status` y `progress` en cada
// hito para que el polling desde 9.3 refleje el avance real.
async function runAnalysisPipeline(
    ctx: {
        note: Note;
        files: Array<{ base64: string; mimeType: string; sizeBytes: number }>;
        oposicion: string;
    },
    repo: INotesRepository,
    ai: AiApiContract,
): Promise<void> {
    const { note, files, oposicion } = ctx;
    try {
        // Fase 1 — OCR
        await repo.updateStatus(note.id, note.userId, { status: 'processing_ocr', progress: 10 });
        const ocr = await ai.analyzeNoteDocument({
            oposicion,
            pages: files.map((f, i) => ({
                pageNumber: i + 1,
                imageBase64: f.base64,
                mimeType: f.mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
            })),
        });
        for (const page of ocr.pages) {
            await repo.addPage({
                noteId: note.id,
                userId: note.userId,
                pageNumber: page.pageNumber,
                thumbnailUrl: null, // TODO(bloque9): generar thumbnail y subir a Storage.
                extractedText: page.extractedText,
                ocrConfidence: page.ocrConfidence,
            });
        }
        await repo.updateStatus(note.id, note.userId, { progress: 33 });

        // Fase 2 — tags
        await repo.updateStatus(note.id, note.userId, { status: 'processing_topics', progress: 45 });
        const fullText = ocr.pages.map(p => p.extractedText).join('\n\n');
        const tagsRes = await ai.generateTagsFromNote({ oposicion, fullText });
        await repo.setTags(note.id, note.userId, tagsRes.tags.map(label => ({ label, source: 'ai' as const })));
        await repo.updateStatus(note.id, note.userId, { progress: 66 });

        // Fase 3 — preguntas
        await repo.updateStatus(note.id, note.userId, { status: 'processing_questions', progress: 80 });
        const targetCount = Math.max(5, Math.min(50, ocr.pages.length * 3));
        const questionsRes = await ai.generateQuestionsFromNote({
            oposicion,
            fullText,
            tags: tagsRes.tags,
            count: targetCount,
        });
        await repo.addQuestions({
            noteId: note.id,
            userId: note.userId,
            questions: questionsRes.questions.map(q => ({
                text: q.text,
                options: q.options,
                correctIndex: q.correctIndex,
                explanation: q.explanation,
                tag: q.tag,
                difficulty: q.difficulty,
            })),
        });
        await repo.updateStatus(note.id, note.userId, {
            status: 'ready',
            progress: 100,
            questionsCount: questionsRes.questions.length,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'error desconocido';
        await repo.updateStatus(note.id, note.userId, {
            status: 'error',
            errorCode: 'UNKNOWN',
            errorMessage: message,
        });
    }
}
