import { api } from './client';
import { API_ROUTES } from '@opox/constants';

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
        api.post(API_ROUTES.TRAINING.ATTEMPTS, body, { auth: true }),

    listErrorPatterns: () =>
        api.get(API_ROUTES.TRAINING.ERROR_PATTERNS, { auth: true }),

    listBookmarks: () =>
        api.get(API_ROUTES.TRAINING.BOOKMARKS, { auth: true }),

    saveBookmark: (body) =>
        api.post(API_ROUTES.TRAINING.BOOKMARKS, body, { auth: true }),

    deleteBookmark: (id) =>
        api.delete(API_ROUTES.TRAINING.BOOKMARK_DELETE.replace(':id', id), { auth: true }),
};
