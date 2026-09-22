import { Router, type RequestHandler } from 'express';
import { API_ROUTES } from '@opox/constants';
import type { TrainingController } from '../controllers';
import { validateBody, validateQuery } from '../middleware';
import {
    listMocksQuerySchema,
    generateQuestionsSchema,
    analyzePhotoSchema,
    generateSurgicalSchema,
    saveAttemptSchema,
    saveBookmarkSchema,
    hintSchema,
    reportQuestionSchema,
    rateQuestionSchema,
    saveMockProgressSchema,
    saveLawViewSchema,
} from '../validators';

/** La mayoría de rutas del Bloque 6 requieren sesión. LEVEL_TEST es pública (onboarding). */
export function createTrainingRouter(
    controller: TrainingController,
    authMiddleware: RequestHandler,
): Router {
    const r = Router();

    // Ruta pública — sin auth — para el test de nivel en el onboarding
    r.get(API_ROUTES.TRAINING.LEVEL_TEST, controller.getLevelTest);

    r.get(
        API_ROUTES.TRAINING.MOCKS,
        authMiddleware,
        validateQuery(listMocksQuerySchema),
        controller.listMockExams,
    );

    r.get(
        API_ROUTES.TRAINING.MOCK_QUESTIONS,
        authMiddleware,
        controller.getMockQuestions,
    );

    // Rutas literales de progreso — DEBEN ir antes de MOCK_DETAIL
    // ('/training/mocks/:id'), o Express las confunde con id="progress".
    r.get(
        API_ROUTES.TRAINING.MOCK_PROGRESS,
        authMiddleware,
        controller.getMockProgress,
    );

    r.put(
        API_ROUTES.TRAINING.MOCK_PROGRESS,
        authMiddleware,
        validateBody(saveMockProgressSchema),
        controller.saveMockProgress,
    );

    r.delete(
        API_ROUTES.TRAINING.MOCK_PROGRESS,
        authMiddleware,
        controller.clearMockProgress,
    );

    r.get(
        API_ROUTES.TRAINING.MOCK_DETAIL,
        authMiddleware,
        controller.getMockExam,
    );

    r.post(
        API_ROUTES.TRAINING.GENERATE,
        authMiddleware,
        validateBody(generateQuestionsSchema),
        controller.generateQuestions,
    );

    r.post(
        API_ROUTES.TRAINING.PHOTO_TEST,
        authMiddleware,
        validateBody(analyzePhotoSchema),
        controller.analyzePhoto,
    );

    r.post(
        API_ROUTES.TRAINING.SURGICAL,
        authMiddleware,
        validateBody(generateSurgicalSchema),
        controller.generateSurgicalTest,
    );

    // ─── Streaming (Fase 2 · gaps-15-09-26) ──────────────────────────────
    // Proxies del Motor: startTestJob → job → session → answer. Si el Motor no
    // está configurado en env, cada handler devuelve 503 y el mobile cae al
    // flujo síncrono (/training/generate). Sin schemas Zod estrictos — los
    // handlers solo re-envían campos.
    r.post(API_ROUTES.TRAINING.FROM_CACHE, authMiddleware, controller.getFromCache);
    r.post(API_ROUTES.TRAINING.GENERATE_STREAM, authMiddleware, controller.generateStream);
    r.get(API_ROUTES.TRAINING.JOB_STATUS, authMiddleware, controller.getJobStatus);
    r.get(API_ROUTES.TRAINING.SESSION_QUESTIONS, authMiddleware, controller.getSessionQuestions);
    r.post(API_ROUTES.TRAINING.SESSION_ANSWER, authMiddleware, controller.postSessionAnswer);

    r.post(
        API_ROUTES.TRAINING.ATTEMPTS,
        authMiddleware,
        validateBody(saveAttemptSchema),
        controller.saveAttempt,
    );

    r.get(
        API_ROUTES.TRAINING.ERROR_PATTERNS,
        authMiddleware,
        controller.listErrorPatterns,
    );

    r.get(
        API_ROUTES.TRAINING.BOOKMARKS,
        authMiddleware,
        controller.listBookmarks,
    );

    r.post(
        API_ROUTES.TRAINING.BOOKMARKS,
        authMiddleware,
        validateBody(saveBookmarkSchema),
        controller.saveBookmark,
    );

    r.delete(
        API_ROUTES.TRAINING.BOOKMARK_DELETE,
        authMiddleware,
        controller.deleteBookmark,
    );

    r.post(
        API_ROUTES.TRAINING.HINT,
        authMiddleware,
        validateBody(hintSchema),
        controller.generateHint,
    );

    r.post(
        API_ROUTES.TRAINING.QUESTION_REPORT,
        authMiddleware,
        validateBody(reportQuestionSchema),
        controller.reportQuestion,
    );

    r.post(
        API_ROUTES.TRAINING.QUESTION_RATE,
        authMiddleware,
        validateBody(rateQuestionSchema),
        controller.rateQuestion,
    );

    r.get(
        API_ROUTES.TRAINING.TOPICS,
        authMiddleware,
        controller.listTopics,
    );

    r.get(
        API_ROUTES.TRAINING.TOPICS_INVENTORY,
        authMiddleware,
        controller.getTopicsInventory,
    );

    r.post(
        API_ROUTES.TRAINING.LAW_VIEW,
        authMiddleware,
        validateBody(saveLawViewSchema),
        controller.saveLawView,
    );

    // ─── Banco de exámenes oficiales (Bloque 6.6 · Motor IA) ─────────────
    // Proxies del Motor. Si no está configurado, cada handler responde 503.
    // Sin schemas Zod estrictos aquí — el use case valida el body internamente
    // (fuente, MIME, tamaño) y lanza BankExamValidationError con status propio.
    r.get(API_ROUTES.TRAINING.BANK_EXAMS, authMiddleware, controller.listBankExams);
    r.post(API_ROUTES.TRAINING.BANK_EXAM_UPLOAD, authMiddleware, controller.uploadBankExam);
    r.get(API_ROUTES.TRAINING.BANK_EXAM_JOB, authMiddleware, controller.getBankExamJob);
    r.post(API_ROUTES.TRAINING.BANK_MOCK_START, authMiddleware, controller.startBankMock);
    r.get(API_ROUTES.TRAINING.BANK_MOCK_RESULT, authMiddleware, controller.getBankMockResult);

    return r;
}
