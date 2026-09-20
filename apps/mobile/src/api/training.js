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

    rateQuestion: (questionId, rating) =>
        api.post(
            API_ROUTES.TRAINING.QUESTION_RATE.replace(':id', questionId),
            { rating },
            { auth: true },
        ),

    getMockProgress: () =>
        api.get(API_ROUTES.TRAINING.MOCK_PROGRESS, { auth: true }),

    saveMockProgress: (body) =>
        api.put(API_ROUTES.TRAINING.MOCK_PROGRESS, body, { auth: true }),

    clearMockProgress: () =>
        api.delete(API_ROUTES.TRAINING.MOCK_PROGRESS, { auth: true }),

    saveLawView: (body) =>
        api.post(API_ROUTES.TRAINING.LAW_VIEW, body, { auth: true }),

    listTopics: () => api.get(API_ROUTES.TRAINING.TOPICS, { auth: true }),

    // Ruta pública — no requiere sesión — para el test de nivel en onboarding
    getLevelTestQuestions: (oposicion = 'justicia-tramitacion') =>
        api.get(
            `${API_ROUTES.TRAINING.LEVEL_TEST}?oposicion=${encodeURIComponent(oposicion)}`,
            { auth: false },
        ),

    // ─── Streaming (Fase 2 · gaps-15-09-26) ────────────────────────────────
    // Devuelven 503 { code:'MOTOR_UNAVAILABLE' } cuando el Motor no está configurado.
    // El caller debe detectarlo para caer al flujo síncrono (`generateQuestions`).
    startTestJob: (body) =>
        api.post(API_ROUTES.TRAINING.GENERATE_STREAM, body, { auth: true }),
    getJobStatus: (jobId) =>
        api.get(API_ROUTES.TRAINING.JOB_STATUS.replace(':jobId', jobId), { auth: true }),
    getSessionQuestions: (sessionId, opts = {}) => {
        let url = API_ROUTES.TRAINING.SESSION_QUESTIONS.replace(':sessionId', sessionId);
        const qs = [];
        if (opts.temaIds) qs.push(`temaIds=${encodeURIComponent(opts.temaIds)}`);
        if (opts.done) qs.push('done=1');
        if (qs.length) url += `?${qs.join('&')}`;
        return api.get(url, { auth: true });
    },
    postSessionAnswer: (sessionId, body) =>
        api.post(API_ROUTES.TRAINING.SESSION_ANSWER.replace(':sessionId', sessionId), body, { auth: true }),

    // ─── Banco de exámenes oficiales (Bloque 6.6 · Motor IA) ────────────────
    // Todas devuelven 503 { code:'MOTOR_UNAVAILABLE' } si el backend no tiene
    // el Motor configurado — el caller muestra empty-state, nunca fallback local.
    listBankExams: (limit = 100, offset = 0) =>
        api.get(
            `${API_ROUTES.TRAINING.BANK_EXAMS}?limit=${limit}&offset=${offset}`,
            { auth: true },
        ),

    /**
     * Sube un examen al banco del curso activo.
     * @param {{titulo:string, anio:number, fuente:'profesor'|'otro'|'oficial', file:{base64:string, mimeType:string, fileName?:string}}} body
     * @returns {Promise<{data:{jobId:string}, error?:{code:string,message:string}}>}
     */
    uploadBankExam: (body) =>
        api.post(API_ROUTES.TRAINING.BANK_EXAM_UPLOAD, body, { auth: true }),

    getBankExamJob: (jobId) =>
        api.get(API_ROUTES.TRAINING.BANK_EXAM_JOB.replace(':jobId', jobId), { auth: true }),

    /**
     * Arranca un simulacro real del banco. Devuelve sesión Motor + preguntas SIN correctIndex
     * — la corrección se resuelve por pregunta con postSessionAnswer.
     */
    startBankMock: (body) =>
        api.post(API_ROUTES.TRAINING.BANK_MOCK_START, body, { auth: true }),

    getBankMockResult: (sessionId) =>
        api.get(
            API_ROUTES.TRAINING.BANK_MOCK_RESULT.replace(':sessionId', sessionId),
            { auth: true },
        ),
};
