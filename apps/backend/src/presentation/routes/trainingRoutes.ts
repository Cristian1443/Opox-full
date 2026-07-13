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
} from '../validators';

/** Todas las rutas del Bloque 6 requieren sesión. */
export function createTrainingRouter(
    controller: TrainingController,
    authMiddleware: RequestHandler,
): Router {
    const r = Router();

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

    return r;
}
