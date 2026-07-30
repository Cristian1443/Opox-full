import type { Request, Response, NextFunction } from 'express';
import type {
    Note as NoteDTO,
    NoteDetail as NoteDetailDTO,
    NoteAnalysisStatus as NoteStatusDTO,
    NotesStats as NotesStatsDTO,
    ApiSuccessResponse,
    NotePage as NotePageDTO,
} from '@opox/types';
import type {
    ListNotesUseCase,
    GetNoteUseCase,
    UploadNoteUseCase,
    GetNoteStatusUseCase,
    UpdateNoteTagsUseCase,
    DeleteNoteUseCase,
    GenerateTestFromNoteUseCase,
} from '../../application';
import type { Note, NotePage } from '../../domain/entities';

function ok<T>(res: Response, status: number, data: T): void {
    res.status(status).json({ ok: true, data } satisfies ApiSuccessResponse<T>);
}

export class NotesController {
    constructor(
        private readonly deps: {
            listNotes: ListNotesUseCase;
            getNote: GetNoteUseCase;
            uploadNote: UploadNoteUseCase;
            getNoteStatus: GetNoteStatusUseCase;
            updateTags: UpdateNoteTagsUseCase;
            deleteNote: DeleteNoteUseCase;
            generateTest: GenerateTestFromNoteUseCase;
        },
    ) {}

    // GET /notes
    listNotes = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.authUser!.id;
            const { stats, notes } = await this.deps.listNotes.execute(userId);
            const payload: { stats: NotesStatsDTO; notes: NoteDTO[] } = {
                stats,
                notes: notes.map(serializeNote),
            };
            ok(res, 200, payload);
        } catch (e) { next(e); }
    };

    // GET /notes/:id
    getNote = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.authUser!.id;
            const { note, pages, tags } = await this.deps.getNote.execute((req.params.id as string), userId);
            const detail: NoteDetailDTO = {
                id: note.id,
                title: note.title,
                fileName: note.fileName,
                kind: note.kind,
                pages: note.pages,
                status: note.status,
                tags: tags.map(t => t.label),
                questionsCount: note.questionsCount,
                createdAt: note.createdAt.toISOString(),
                pageThumbnails: pages.map(serializePage),
            };
            ok(res, 200, detail);
        } catch (e) { next(e); }
    };

    // POST /notes/upload
    uploadNote = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.authUser!.id;
            const { oposicion, kind, fileName, files } = req.body as {
                oposicion: string;
                kind: 'pdf' | 'photo';
                fileName: string;
                files: Array<{ base64: string; mimeType: string; sizeBytes: number }>;
            };
            const result = await this.deps.uploadNote.execute({
                userId, oposicion, kind, fileName, files,
            });
            ok(res, 201, result);
        } catch (e) { next(e); }
    };

    // GET /notes/:id/status
    getStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.authUser!.id;
            const status = await this.deps.getNoteStatus.execute((req.params.id as string), userId);
            const dto: NoteStatusDTO = {
                noteId: status.noteId,
                status: status.status,
                progress: status.progress,
                pagesDone: status.pagesDone,
                topicsFound: status.topicsFound,
                questionsGenerated: status.questionsGenerated,
                errorCode: (status.errorCode as NoteStatusDTO['errorCode']) ?? undefined,
                errorMessage: status.errorMessage ?? undefined,
                pagesWithLowConfidence: status.pagesWithLowConfidence,
            };
            ok(res, 200, dto);
        } catch (e) { next(e); }
    };

    // PUT /notes/:id/tags
    updateTags = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.authUser!.id;
            const { tags } = req.body as { tags: string[] };
            const updated = await this.deps.updateTags.execute((req.params.id as string), userId, tags);
            ok(res, 200, { tags: updated.map(t => t.label) });
        } catch (e) { next(e); }
    };

    // DELETE /notes/:id
    deleteNote = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.authUser!.id;
            await this.deps.deleteNote.execute((req.params.id as string), userId);
            res.status(204).end();
        } catch (e) { next(e); }
    };

    // POST /notes/:id/generate-test
    generateTest = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.authUser!.id;
            const { questionCount, topics } = req.body as {
                questionCount: number;
                topics: string[];
            };
            const result = await this.deps.generateTest.execute({
                id: (req.params.id as string),
                userId,
                questionCount,
                topics,
            });
            ok(res, 200, result);
        } catch (e) { next(e); }
    };
}

// ─── Serializers dominio → DTO ──────────────────────────────────────────────

function serializeNote(n: Note): NoteDTO {
    return {
        id: n.id,
        title: n.title,
        kind: n.kind,
        pages: n.pages,
        questionsCount: n.questionsCount,
        status: n.status,
        createdAt: n.createdAt.toISOString(),
    };
}

function serializePage(p: NotePage): NotePageDTO {
    return {
        pageNumber: p.pageNumber,
        thumbnailUrl: p.thumbnailUrl,
        ocrConfidence: p.ocrConfidence,
        extractedText: p.extractedText ?? undefined,
    };
}
