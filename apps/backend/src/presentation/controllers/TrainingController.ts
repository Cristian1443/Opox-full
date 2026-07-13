import type { Request, Response, NextFunction } from 'express';
import type {
    ApiSuccessResponse,
    MockExamDTO,
    ErrorPatternDTO,
    TrainingAttemptDTO,
    TrainingBookmarkDTO,
    GeneratedQuestion,
    PhotoTestResult,
    SurgicalTestResult,
    ListMocksQuery,
    GenerateQuestionsRequest,
    AnalyzePhotoRequest,
    GenerateSurgicalRequest,
    SaveAttemptRequest,
    SaveBookmarkRequest,
} from '@opox/types';
import type {
    ListMockExamsUseCase,
    GetMockExamUseCase,
    GenerateQuestionsUseCase,
    AnalyzePhotoUseCase,
    GenerateSurgicalTestUseCase,
    SaveAttemptUseCase,
    ListErrorPatternsUseCase,
    ListBookmarksUseCase,
    SaveBookmarkUseCase,
    DeleteBookmarkUseCase,
} from '../../application';
import type { MockExamWithStatus } from '../../domain/entities/MockExam';
import type { TrainingAttempt } from '../../domain/entities/TrainingAttempt';
import type { TrainingBookmark } from '../../domain/entities/TrainingBookmark';
import type { ErrorPattern } from '../../domain/entities/MockExam';
import { MockExamNotFoundError } from '../../domain';

export class TrainingController {
    constructor(
        private readonly deps: {
            listMockExams: ListMockExamsUseCase;
            getMockExam: GetMockExamUseCase;
            generateQuestions: GenerateQuestionsUseCase;
            analyzePhoto: AnalyzePhotoUseCase;
            generateSurgicalTest: GenerateSurgicalTestUseCase;
            saveAttempt: SaveAttemptUseCase;
            listErrorPatterns: ListErrorPatternsUseCase;
            listBookmarks: ListBookmarksUseCase;
            saveBookmark: SaveBookmarkUseCase;
            deleteBookmark: DeleteBookmarkUseCase;
        },
    ) { }

    // ─── Serializers ──────────────────────────────

    private serializeMockExam(item: MockExamWithStatus): MockExamDTO {
        return {
            id: item.exam.id,
            oposicion: item.exam.oposicion,
            year: item.exam.year,
            title: item.exam.title,
            category: item.exam.category,
            questionCount: item.exam.questionCount,
            durationMinutes: item.exam.durationMinutes,
            penaltyRatio: item.exam.penaltyRatio,
            status: item.status,
            bestScore: item.bestScore,
            completedAt: item.completedAt?.toISOString() ?? null,
        };
    }

    private serializeAttempt(attempt: TrainingAttempt): TrainingAttemptDTO {
        return {
            id: attempt.id,
            source: attempt.source,
            mockExamId: attempt.mockExamId,
            topicId: attempt.topicId,
            difficulty: attempt.difficulty,
            questionCount: attempt.questionCount,
            correctCount: attempt.correctCount,
            wrongCount: attempt.wrongCount,
            blankCount: attempt.blankCount,
            score: attempt.score,
            durationSecs: attempt.durationSecs,
            completedAt: attempt.completedAt.toISOString(),
        };
    }

    private serializeErrorPattern(p: ErrorPattern): ErrorPatternDTO {
        return {
            topicId: p.topicId,
            topic: p.topic,
            totalAnswered: p.totalAnswered,
            domain: p.domain,
            failRate: p.failRate,
        };
    }

    private serializeBookmark(b: TrainingBookmark): TrainingBookmarkDTO {
        return {
            id: b.id,
            concept: b.concept,
            question: b.question,
            answer: b.answer,
            relatedTopicId: b.relatedTopicId,
            createdAt: b.createdAt.toISOString(),
        };
    }

    private ok<T>(res: Response, status: number, data: T): void {
        const body: ApiSuccessResponse<T> = { ok: true, data };
        res.status(status).json(body);
    }

    // ─── Handlers ─────────────────────────────────

    listMockExams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const query = req.validatedQuery as ListMocksQuery;
            const items = await this.deps.listMockExams.execute({
                userId: req.authUser!.id,
                oposicion: query.oposicion,
            });
            this.ok(res, 200, items.map((i) => this.serializeMockExam(i)));
        } catch (err) { next(err); }
    };

    getMockExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { exam, questions } = await this.deps.getMockExam.execute({
                userId: req.authUser!.id,
                mockExamId: req.params['id'] as string,
            });
            if (!exam) throw new MockExamNotFoundError();
            this.ok(res, 200, { exam: this.serializeMockExam({ exam, status: 'pending', bestScore: null, completedAt: null }), questions });
        } catch (err) { next(err); }
    };

    getMockQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { exam, questions } = await this.deps.getMockExam.execute({
                userId: req.authUser!.id,
                mockExamId: req.params['id'] as string,
            });
            if (!exam) throw new MockExamNotFoundError();
            this.ok<GeneratedQuestion[]>(res, 200, questions);
        } catch (err) { next(err); }
    };

    generateQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = req.body as GenerateQuestionsRequest;
            const questions = await this.deps.generateQuestions.execute({
                userId: req.authUser!.id,
                oposicion: body.oposicion,
                topicId: body.topicId,
                difficulty: body.difficulty,
                count: body.count,
            });
            this.ok<GeneratedQuestion[]>(res, 200, questions);
        } catch (err) { next(err); }
    };

    analyzePhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = req.body as AnalyzePhotoRequest;
            const result = await this.deps.analyzePhoto.execute(body);
            this.ok<PhotoTestResult>(res, 200, result);
        } catch (err) { next(err); }
    };

    generateSurgicalTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = req.body as GenerateSurgicalRequest;
            const result = await this.deps.generateSurgicalTest.execute({
                userId: req.authUser!.id,
                oposicion: body.oposicion,
                count: body.count,
            });
            this.ok<SurgicalTestResult>(res, 200, result);
        } catch (err) { next(err); }
    };

    saveAttempt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = req.body as SaveAttemptRequest;
            const attempt = await this.deps.saveAttempt.execute({
                userId: req.authUser!.id,
                ...body,
            });
            this.ok(res, 201, this.serializeAttempt(attempt));
        } catch (err) { next(err); }
    };

    listErrorPatterns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const patterns = await this.deps.listErrorPatterns.execute(req.authUser!.id);
            this.ok(res, 200, patterns.map((p) => this.serializeErrorPattern(p)));
        } catch (err) { next(err); }
    };

    listBookmarks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const bookmarks = await this.deps.listBookmarks.execute(req.authUser!.id);
            this.ok(res, 200, bookmarks.map((b) => this.serializeBookmark(b)));
        } catch (err) { next(err); }
    };

    saveBookmark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = req.body as SaveBookmarkRequest;
            const bookmark = await this.deps.saveBookmark.execute({
                userId: req.authUser!.id,
                ...body,
            });
            this.ok(res, 201, this.serializeBookmark(bookmark));
        } catch (err) { next(err); }
    };

    deleteBookmark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.deps.deleteBookmark.execute({
                userId: req.authUser!.id,
                bookmarkId: req.params['id'] as string,
            });
            res.status(204).end();
        } catch (err) { next(err); }
    };
}
