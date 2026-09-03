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
    ListTopicsUseCase,
} from '../../application';
import type { MockExamWithStatus } from '../../domain/entities/MockExam';
import type { TrainingAttempt } from '../../domain/entities/TrainingAttempt';
import type { TrainingBookmark } from '../../domain/entities/TrainingBookmark';
import type { ErrorPattern } from '../../domain/entities/MockExam';
import { MockExamNotFoundError } from '../../domain';
import type { MotorOnboardingClient, LevelTestQuestion } from '../../infrastructure/clients/MotorOnboardingClient';

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
            listTopics: ListTopicsUseCase;
            motorOnboarding?: MotorOnboardingClient;
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

    generateHint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const body = req.body as HintRequest;
            const result = await this.deps.generateHint.execute({
                questionId: body.questionId,
                questionText: body.questionText,
                options: body.options as [string, string, string, string],
                topicId: body.topicId,
                topic: body.topic,
                oposicion: body.oposicion,
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

    // GET /training/topics?oposicion=
    listTopics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const oposicion = (req.query['oposicion'] as string) ?? '';
            const topics = await this.deps.listTopics.execute(oposicion);
            this.ok(res, 200, topics);
        } catch (err) { next(err); }
    };

    // GET /training/level-test?oposicion= — PÚBLICO (sin auth, onboarding)
    getLevelTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const oposicion = (req.query['oposicion'] as string) ?? 'justicia-tramitacion';

            if (this.deps.motorOnboarding) {
                try {
                    const questions = await this.deps.motorOnboarding.getLevelTestQuestions(oposicion, 20);
                    this.ok<LevelTestQuestion[]>(res, 200, questions);
                    return;
                } catch {
                    // Motor falló — usar estático sin propagar el error al cliente
                }
            }

            this.ok<LevelTestQuestion[]>(res, 200, STATIC_LEVEL_TEST);
        } catch (err) { next(err); }
    };
}
