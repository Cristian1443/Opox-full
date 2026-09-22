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
    HintResult,
    ListMocksQuery,
    GenerateQuestionsRequest,
    AnalyzePhotoRequest,
    GenerateSurgicalRequest,
    SaveAttemptRequest,
    SaveBookmarkRequest,
    HintRequest,
    ReportQuestionRequest,
    RateQuestionRequest,
    RateQuestionResponse,
    SaveMockProgressRequest,
    MockProgressDTO,
    SaveLawViewRequest,
    BankExamDTO,
    BankExamJobStatus,
    StartBankMockRequest,
    StartBankMockResponse,
    UploadBankExamRequest,
    UploadBankExamResponse,
    BankMockResultDTO,
    TopicInventoryDTO,
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
    GenerateHintUseCase,
    ReportQuestionUseCase,
    RateQuestionUseCase,
    SaveMockProgressUseCase,
    GetMockProgressUseCase,
    ClearMockProgressUseCase,
    SaveLawViewUseCase,
    ListTopicsUseCase,
    GetCursoIdUseCase,
    StartTestJobUseCase,
    GetJobStatusUseCase,
    GetSessionQuestionsUseCase,
    PostSessionAnswerUseCase,
    GetTopicsInventoryUseCase,
    ListBankExamsUseCase,
    UploadBankExamUseCase,
    GetBankExamJobUseCase,
    StartBankMockUseCase,
    GetBankMockResultUseCase,
} from '../../application';
import type { MockExamProgress } from '../../domain/entities/MockExam';
import type { MockExamWithStatus } from '../../domain/entities/MockExam';
import type { TrainingAttempt } from '../../domain/entities/TrainingAttempt';
import type { TrainingBookmark } from '../../domain/entities/TrainingBookmark';
import type { ErrorPattern } from '../../domain/entities/MockExam';
import { MockExamNotFoundError } from '../../domain';
import type { MotorOnboardingClient, LevelTestQuestion } from '../../infrastructure/clients/MotorOnboardingClient';
import { parseTemaIds } from '../../infrastructure/clients/MotorAiClient';

// ─── Preguntas de nivel estáticas (fallback sin Motor) ────────────────────────
// Solo las primeras 20 — misma distribución que LevelTestInProgressScreen.js
const STATIC_LEVEL_TEST: LevelTestQuestion[] = [
    { id: 1, topic: 'ley-39',       topicLabel: 'Ley 39/2015',      question: 'Según la Ley 39/2015, el plazo general para resolver un procedimiento administrativo es de:', options: [{ id:'A', text:'Un mes' }, { id:'B', text:'Tres meses' }, { id:'C', text:'Seis meses' }, { id:'D', text:'Un año' }], correct: 'C' },
    { id: 2, topic: 'constitucion', topicLabel: 'Constitución',      question: '¿Cuántos artículos tiene la Constitución Española de 1978?', options: [{ id:'A', text:'159' }, { id:'B', text:'169' }, { id:'C', text:'179' }, { id:'D', text:'189' }], correct: 'B' },
    { id: 3, topic: 'org-estado',   topicLabel: 'Org. del Estado',   question: '¿Cuál es el órgano colegiado supremo de la Administración General del Estado?', options: [{ id:'A', text:'El Congreso de los Diputados' }, { id:'B', text:'El Senado' }, { id:'C', text:'El Consejo de Ministros' }, { id:'D', text:'El Tribunal Supremo' }], correct: 'C' },
    { id: 4, topic: 'constitucion', topicLabel: 'Constitución',      question: '¿En qué fecha fue ratificada la Constitución Española en referéndum?', options: [{ id:'A', text:'31 de octubre de 1978' }, { id:'B', text:'6 de diciembre de 1978' }, { id:'C', text:'27 de diciembre de 1978' }, { id:'D', text:'29 de diciembre de 1978' }], correct: 'B' },
    { id: 5, topic: 'ley-40',       topicLabel: 'Ley 40/2015',       question: 'Según la Ley 40/2015, las relaciones entre Administraciones Públicas se rigen por el principio de:', options: [{ id:'A', text:'Jerarquía' }, { id:'B', text:'Lealtad institucional' }, { id:'C', text:'Subordinación' }, { id:'D', text:'Unidad de mando' }], correct: 'B' },
    { id: 6, topic: 'ley-39',       topicLabel: 'Ley 39/2015',       question: 'El recurso de alzada debe interponerse en el plazo máximo de:', options: [{ id:'A', text:'1 mes si el acto es expreso' }, { id:'B', text:'2 meses si el acto es expreso' }, { id:'C', text:'3 meses siempre' }, { id:'D', text:'6 meses siempre' }], correct: 'A' },
    { id: 7, topic: 'ley-39',       topicLabel: 'Ley 39/2015',       question: 'El silencio administrativo en procedimientos iniciados a solicitud del interesado se considera, con carácter general:', options: [{ id:'A', text:'Negativo' }, { id:'B', text:'Positivo' }, { id:'C', text:'Nulo de pleno derecho' }, { id:'D', text:'Anulable' }], correct: 'B' },
    { id: 8, topic: 'constitucion', topicLabel: 'Constitución',      question: '¿Cuántos magistrados componen el Tribunal Constitucional?', options: [{ id:'A', text:'9' }, { id:'B', text:'10' }, { id:'C', text:'12' }, { id:'D', text:'15' }], correct: 'C' },
    { id: 9, topic: 'constitucion', topicLabel: 'Constitución',      question: 'Según el artículo 1 de la Constitución, la forma política del Estado español es:', options: [{ id:'A', text:'República parlamentaria' }, { id:'B', text:'Monarquía constitucional' }, { id:'C', text:'Monarquía parlamentaria' }, { id:'D', text:'Estado federado' }], correct: 'C' },
    { id: 10, topic: 'ley-39',      topicLabel: 'Ley 39/2015',       question: 'La Ley 39/2015 del Procedimiento Administrativo Común entró en vigor el:', options: [{ id:'A', text:'1 de enero de 2016' }, { id:'B', text:'2 de octubre de 2016' }, { id:'C', text:'1 de enero de 2017' }, { id:'D', text:'2 de octubre de 2017' }], correct: 'B' },
    { id: 11, topic: 'ley-39',      topicLabel: 'Ley 39/2015',       question: '¿Cuántos días hábiles tiene el interesado para subsanar defectos en su solicitud según la Ley 39/2015?', options: [{ id:'A', text:'5 días hábiles' }, { id:'B', text:'10 días hábiles' }, { id:'C', text:'15 días hábiles' }, { id:'D', text:'20 días hábiles' }], correct: 'B' },
    { id: 12, topic: 'constitucion', topicLabel: 'Constitución',     question: 'El Defensor del Pueblo es elegido por:', options: [{ id:'A', text:'El Gobierno' }, { id:'B', text:'El Rey' }, { id:'C', text:'Las Cortes Generales' }, { id:'D', text:'El Tribunal Constitucional' }], correct: 'C' },
    { id: 13, topic: 'ley-39',      topicLabel: 'Ley 39/2015',       question: 'En el cómputo de plazos en días hábiles, se excluyen:', options: [{ id:'A', text:'Solo los festivos nacionales' }, { id:'B', text:'Los sábados, domingos y festivos' }, { id:'C', text:'Solo los domingos' }, { id:'D', text:'Los festivos autonómicos únicamente' }], correct: 'B' },
    { id: 14, topic: 'org-estado',  topicLabel: 'Org. del Estado',   question: 'La Administración General del Estado se organiza territorialmente principalmente en:', options: [{ id:'A', text:'Comunidades Autónomas' }, { id:'B', text:'Delegaciones y Subdelegaciones del Gobierno' }, { id:'C', text:'Municipios' }, { id:'D', text:'Diputaciones Provinciales' }], correct: 'B' },
    { id: 15, topic: 'constitucion', topicLabel: 'Constitución',     question: '¿Qué artículo de la Constitución Española reconoce el principio de igualdad ante la ley?', options: [{ id:'A', text:'Artículo 12' }, { id:'B', text:'Artículo 14' }, { id:'C', text:'Artículo 16' }, { id:'D', text:'Artículo 18' }], correct: 'B' },
    { id: 16, topic: 'ley-39',      topicLabel: 'Ley 39/2015',       question: 'El recurso de reposición es un recurso:', options: [{ id:'A', text:'Ordinario ante el superior jerárquico' }, { id:'B', text:'Extraordinario ante el mismo órgano' }, { id:'C', text:'Potestativo previo al contencioso-administrativo' }, { id:'D', text:'Obligatorio en todo caso' }], correct: 'C' },
    { id: 17, topic: 'ley-40',      topicLabel: 'Ley 40/2015',       question: 'La Ley 40/2015 de Régimen Jurídico del Sector Público entró en vigor el:', options: [{ id:'A', text:'1 de enero de 2016' }, { id:'B', text:'2 de octubre de 2016' }, { id:'C', text:'1 de enero de 2017' }, { id:'D', text:'1 de octubre de 2017' }], correct: 'B' },
    { id: 18, topic: 'constitucion', topicLabel: 'Constitución',     question: 'Según la Constitución, el Congreso de los Diputados se compone de:', options: [{ id:'A', text:'Un mínimo de 300 y un máximo de 400 diputados' }, { id:'B', text:'Un mínimo de 250 y un máximo de 350 diputados' }, { id:'C', text:'Un número fijo de 350 diputados' }, { id:'D', text:'Un mínimo de 350 y un máximo de 450 diputados' }], correct: 'A' },
    { id: 19, topic: 'constitucion', topicLabel: 'Constitución',     question: '¿Cuántos títulos numerados (del I al X) contiene la Constitución Española?', options: [{ id:'A', text:'8' }, { id:'B', text:'9' }, { id:'C', text:'10' }, { id:'D', text:'11' }], correct: 'C' },
    { id: 20, topic: 'ley-39',      topicLabel: 'Ley 39/2015',       question: 'Los actos administrativos de las Administraciones Públicas sujetos al Derecho Administrativo se presumirán:', options: [{ id:'A', text:'Definitivos y ejecutorios' }, { id:'B', text:'Válidos y producirán efectos desde la fecha en que se dicten' }, { id:'C', text:'Firmes desde su notificación' }, { id:'D', text:'Ejecutivos salvo suspensión judicial' }], correct: 'B' },
];

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
            generateHint: GenerateHintUseCase;
            reportQuestion: ReportQuestionUseCase;
            rateQuestion: RateQuestionUseCase;
            saveMockProgress: SaveMockProgressUseCase;
            getMockProgress: GetMockProgressUseCase;
            clearMockProgress: ClearMockProgressUseCase;
            saveLawView: SaveLawViewUseCase;
            listTopics: ListTopicsUseCase;
            getCursoId: GetCursoIdUseCase;
            motorOnboarding?: MotorOnboardingClient;
            // Streaming API (opcional — solo disponible cuando el Motor está configurado)
            startTestJob?: StartTestJobUseCase;
            getJobStatus?: GetJobStatusUseCase;
            getSessionQuestions?: GetSessionQuestionsUseCase;
            postSessionAnswer?: PostSessionAnswerUseCase;
            getTopicsInventory?: GetTopicsInventoryUseCase;
            // Bloque 6.6 · Banco de exámenes oficiales — opcional (requiere Motor)
            listBankExams?: ListBankExamsUseCase;
            uploadBankExam?: UploadBankExamUseCase;
            getBankExamJob?: GetBankExamJobUseCase;
            startBankMock?: StartBankMockUseCase;
            getBankMockResult?: GetBankMockResultUseCase;
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
            lastAttemptDate: p.lastAttemptDate,
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

    private serializeMockProgress(p: MockExamProgress): MockProgressDTO {
        return {
            mockExamId: p.mockExamId,
            examTitle: p.examTitle,
            currentIndex: p.currentIndex,
            questionCount: p.questionCount,
            answers: p.answers,
            updatedAt: p.updatedAt.toISOString(),
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
            const cursoId = await this.deps.getCursoId.execute(body.oposicion);
            const questions = await this.deps.generateQuestions.execute({
                userId: req.authUser!.id,
                oposicion: body.oposicion,
                cursoId,
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

            // Normalizar relatedTopicId: si el slug devuelto por la IA (ej. "ley-39")
            // no pertenece al curso activo, reemplazarlo por 'foto-test' para que el
            // intento se registre correctamente en el Laboratorio de Errores.
            if (result.relatedTopicId && result.relatedTopicId !== 'all') {
                const courseTopics = await this.deps.listTopics.execute(body.oposicion ?? '');
                const validIds = new Set(courseTopics.map((t) => t.topicId));
                if (!validIds.has(result.relatedTopicId)) {
                    result.relatedTopicId = 'foto-test';
                }
            }

            this.ok<PhotoTestResult>(res, 200, result);
        } catch (err) { next(err); }
    };

    generateSurgicalTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = req.body as GenerateSurgicalRequest;
            const cursoId = await this.deps.getCursoId.execute(body.oposicion);
            const result = await this.deps.generateSurgicalTest.execute({
                userId: req.authUser!.id,
                oposicion: body.oposicion,
                cursoId,
                count: body.count,
            });
            this.ok<SurgicalTestResult>(res, 200, result);
        } catch (err) { next(err); }
    };

    // ─── Streaming (Fase 2 · gaps-15-09-26) ────────────────────────────────
    // Proxies delgados al Motor. Si el Motor no está configurado, devuelven
    // 503 SERVICE_UNAVAILABLE y el mobile cae al flujo síncrono legacy.

    private motorUnavailable(res: Response): void {
        res.status(503).json({
            error: { code: 'MOTOR_UNAVAILABLE', message: 'Streaming no disponible. Usa /training/generate.' },
        });
    }

    generateStream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!this.deps.startTestJob) { this.motorUnavailable(res); return; }
            const body = req.body as { oposicion: string; count?: number; difficulty?: 'easy' | 'medium' | 'hard'; topicId?: string };
            // Cap defensivo: el Motor rechaza n_preguntas > 50 con 422 opaco
            // (G04). El picker del mobile ya cap a 30 (G09) pero validamos
            // aquí por defensa en profundidad.
            const requestedCount = Math.max(1, Math.min(50, body.count ?? 10));
            const result = await this.deps.startTestJob.execute({
                userId: req.authUser!.id,
                oposicion: body.oposicion,
                temaIds: parseTemaIds(body.topicId),
                count: requestedCount,
                difficulty: body.difficulty,
            });
            this.ok(res, 202, result);
        } catch (err) { next(err); }
    };

    getJobStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!this.deps.getJobStatus) { this.motorUnavailable(res); return; }
            const result = await this.deps.getJobStatus.execute(String(req.params['jobId']));
            this.ok(res, 200, result);
        } catch (err) { next(err); }
    };

    getSessionQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!this.deps.getSessionQuestions) { this.motorUnavailable(res); return; }
            const temaIds = req.query['temaIds']
                ? String(req.query['temaIds']).split(',').map((s) => s.trim()).filter(Boolean)
                : undefined;
            const jobDone = req.query['done'] === '1';
            const result = await this.deps.getSessionQuestions.execute(
                String(req.params['sessionId']),
                { requestedTemaIds: temaIds, jobDone },
            );
            this.ok(res, 200, result);
        } catch (err) { next(err); }
    };

    postSessionAnswer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!this.deps.postSessionAnswer) { this.motorUnavailable(res); return; }
            const body = req.body as { questionId: string; optionIndex: number };
            const result = await this.deps.postSessionAnswer.execute({
                userId: req.authUser!.id,
                sessionId: String(req.params['sessionId']),
                questionId: body.questionId,
                optionIndex: body.optionIndex,
            });
            this.ok(res, 200, result);
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

    generateHint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = req.body as HintRequest;
            const cursoId = await this.deps.getCursoId.execute(body.oposicion);
            const result = await this.deps.generateHint.execute({
                questionId: body.questionId,
                questionText: body.questionText,
                options: body.options as [string, string, string, string],
                topicId: body.topicId,
                topic: body.topic,
                oposicion: body.oposicion,
                cursoId,
            });
            this.ok<HintResult>(res, 200, result);
        } catch (err) { next(err); }
    };

    reportQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = req.body as ReportQuestionRequest;
            await this.deps.reportQuestion.execute({
                userId: req.authUser!.id,
                questionId: req.params['id'] as string,
                reason: body.reason,
                details: body.details,
            });
            res.status(204).end();
        } catch (err) { next(err); }
    };

    rateQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = req.body as RateQuestionRequest;
            const result = await this.deps.rateQuestion.execute({
                userId: req.authUser!.id,
                questionId: req.params['id'] as string,
                rating: body.rating,
            });
            this.ok<RateQuestionResponse>(res, 200, result);
        } catch (err) { next(err); }
    };

    saveMockProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = req.body as SaveMockProgressRequest;
            await this.deps.saveMockProgress.execute({
                userId: req.authUser!.id,
                mockExamId: body.mockExamId,
                examTitle: body.examTitle,
                currentIndex: body.currentIndex,
                questionCount: body.questionCount,
                answers: body.answers,
            });
            res.status(204).end();
        } catch (err) { next(err); }
    };

    getMockProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const progress = await this.deps.getMockProgress.execute(req.authUser!.id);
            this.ok<MockProgressDTO | null>(res, 200, progress ? this.serializeMockProgress(progress) : null);
        } catch (err) { next(err); }
    };

    clearMockProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.deps.clearMockProgress.execute(req.authUser!.id);
            res.status(204).end();
        } catch (err) { next(err); }
    };

    saveLawView = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = req.body as SaveLawViewRequest;
            await this.deps.saveLawView.execute({
                userId: req.authUser!.id,
                law: body.law,
                article: body.article,
                articleTitle: body.articleTitle,
                boeUrl: body.boeUrl,
                topicId: body.topicId,
            });
            res.status(204).end();
        } catch (err) { next(err); }
    };

    // GET /training/topics?oposicion=
    listTopics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const oposicion = (req.query['oposicion'] as string) ?? '';
            const topics = await this.deps.listTopics.execute(oposicion);
            this.ok(res, 200, topics);
        } catch (err) { next(err); }
    };

    // GET /training/topics-inventory — Motor v1.6.0. Informativo para el picker
    // del Generador Infinito; si el Motor no está configurado responde 503 y
    // el mobile lo ignora silenciosamente (no bloquea la generación de tests).
    getTopicsInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!this.deps.getTopicsInventory) { this.motorUnavailable(res); return; }
            const oposicion = req.authUser?.oposicion ?? null;
            const data = await this.deps.getTopicsInventory.execute({
                oposicion,
                userId: req.authUser!.id,
            });
            this.ok<TopicInventoryDTO[]>(res, 200, data);
        } catch (err) {
            if (err instanceof Error && err.message === 'MOTOR_UNAVAILABLE') {
                this.motorUnavailable(res);
                return;
            }
            next(err);
        }
    };

    // GET /training/level-test?oposicion= — PÚBLICO (sin auth, onboarding)
    getLevelTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const oposicion = (req.query['oposicion'] as string) ?? 'justicia-tramitacion';

            if (this.deps.motorOnboarding) {
                try {
                    const questions = await this.deps.motorOnboarding.getLevelTestQuestions(oposicion, 10);
                    this.ok<LevelTestQuestion[]>(res, 200, questions);
                    return;
                } catch {
                    // Motor falló — usar estático sin propagar el error al cliente
                }
            }

            this.ok<LevelTestQuestion[]>(res, 200, STATIC_LEVEL_TEST);
        } catch (err) { next(err); }
    };

    // ─── Bloque 6.6 · Banco de exámenes oficiales (Motor IA) ──────────────────
    // Proxies delgados al MotorAiClient. Si el Motor no está configurado, el use
    // case lanza 'MOTOR_UNAVAILABLE' → controller responde 503 y el móvil muestra
    // empty-state (nunca cae a Supabase).

    listBankExams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!this.deps.listBankExams) { this.motorUnavailable(res); return; }
            const oposicion = req.authUser?.oposicion ?? null;
            const limit = Number(req.query['limit'] ?? 100);
            const offset = Number(req.query['offset'] ?? 0);
            const data = await this.deps.listBankExams.execute({
                userId: req.authUser!.id,
                oposicion,
                limit,
                offset,
            });
            this.ok<BankExamDTO[]>(res, 200, data);
        } catch (err) {
            if (err instanceof Error && err.message === 'MOTOR_UNAVAILABLE') {
                this.motorUnavailable(res);
                return;
            }
            next(err);
        }
    };

    uploadBankExam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!this.deps.uploadBankExam) { this.motorUnavailable(res); return; }
            const body = req.body as UploadBankExamRequest;
            const oposicion = req.authUser?.oposicion ?? null;
            const { jobId } = await this.deps.uploadBankExam.execute({
                userId: req.authUser!.id,
                oposicion,
                request: body,
                isAdmin: false,
            });
            this.ok<UploadBankExamResponse>(res, 202, { jobId });
        } catch (err) {
            if (err instanceof Error && err.message === 'MOTOR_UNAVAILABLE') {
                this.motorUnavailable(res);
                return;
            }
            next(err);
        }
    };

    getBankExamJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!this.deps.getBankExamJob) { this.motorUnavailable(res); return; }
            const jobId = String(req.params['jobId']);
            const status = await this.deps.getBankExamJob.execute(jobId);
            this.ok<BankExamJobStatus>(res, 200, status);
        } catch (err) {
            if (err instanceof Error && err.message === 'MOTOR_UNAVAILABLE') {
                this.motorUnavailable(res);
                return;
            }
            next(err);
        }
    };

    startBankMock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!this.deps.startBankMock) { this.motorUnavailable(res); return; }
            const body = req.body as StartBankMockRequest;
            const oposicion = req.authUser?.oposicion ?? null;
            const data = await this.deps.startBankMock.execute({
                userId: req.authUser!.id,
                oposicion,
                request: body,
            });
            this.ok<StartBankMockResponse>(res, 200, data);
        } catch (err) {
            if (err instanceof Error && err.message === 'MOTOR_UNAVAILABLE') {
                this.motorUnavailable(res);
                return;
            }
            next(err);
        }
    };

    getBankMockResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!this.deps.getBankMockResult) { this.motorUnavailable(res); return; }
            const sessionId = String(req.params['sessionId']);
            const data = await this.deps.getBankMockResult.execute(sessionId);
            this.ok<BankMockResultDTO>(res, 200, data);
        } catch (err) {
            if (err instanceof Error && err.message === 'MOTOR_UNAVAILABLE') {
                this.motorUnavailable(res);
                return;
            }
            next(err);
        }
    };
}
