import { api } from './client';
import { API_ROUTES } from '@opox/constants';

/** Fecha local del dispositivo (YYYY-MM-DD) — para que la racha use la TZ del usuario, no UTC. */
const localDate = () => new Date().toLocaleDateString('sv');

export const trainingApi = {
    listMocks: (oposicion) =>
        api.get(`${API_ROUTES.TRAINING.MOCKS}?oposicion=${encodeURIComponent(oposicion)}`, { auth: true }),

    getMock: (id) =>
        api.get(API_ROUTES.TRAINING.MOCK_DETAIL.replace(':id', id), { auth: true }),

    getMockQuestions: (id) =>
        api.get(API_ROUTES.TRAINING.MOCK_QUESTIONS.replace(':id', id), { auth: true }),

    generateQuestions: (body) =>
        api.post(API_ROUTES.TRAINING.GENERATE, body, { auth: true }),

    analyzePhoto: (imageBase64, mimeType, oposicion) =>
        api.post(API_ROUTES.TRAINING.PHOTO_TEST, { imageBase64, mimeType, oposicion }, { auth: true }),

    generateSurgical: (oposicion, count) =>
        api.post(API_ROUTES.TRAINING.SURGICAL, { oposicion, count }, { auth: true }),

    saveAttempt: (body) =>
        api.post(API_ROUTES.TRAINING.ATTEMPTS, { ...body, localDate: localDate() }, { auth: true }),

    listErrorPatterns: () =>
        api.get(API_ROUTES.TRAINING.ERROR_PATTERNS, { auth: true }),

    listBookmarks: () =>
        api.get(API_ROUTES.TRAINING.BOOKMARKS, { auth: true }),

    saveBookmark: (body) =>
        api.post(API_ROUTES.TRAINING.BOOKMARKS, body, { auth: true }),

    deleteBookmark: (id) =>
        api.delete(API_ROUTES.TRAINING.BOOKMARK_DELETE.replace(':id', id), { auth: true }),

    generateHint: (body) =>
        api.post(API_ROUTES.TRAINING.HINT, body, { auth: true }),

    reportQuestion: (questionId, reason, details) =>
        api.post(
            API_ROUTES.TRAINING.QUESTION_REPORT.replace(':id', questionId),
            { reason, details },
            { auth: true },
        ),

    listTopics: () => api.get(API_ROUTES.TRAINING.TOPICS, { auth: true }),

    // Ruta pública — no requiere sesión — para el test de nivel en onboarding
    getLevelTestQuestions: (oposicion = 'justicia-tramitacion') =>
        api.get(
            `${API_ROUTES.TRAINING.LEVEL_TEST}?oposicion=${encodeURIComponent(oposicion)}`,
            { auth: false },
        ),
};
