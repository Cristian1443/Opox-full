/**
 * Rutas HTTP del backend, compartidas con el mobile para evitar strings
 * dispersos y drift entre cliente y servidor.
 */

export const API_ROUTES = {
    HEALTH: '/health',
    HEALTH_DEVICES: '/health/devices',
    HEALTH_DEVICE: '/health/devices/:deviceId',
    HEALTH_FATIGUE: '/health/fatigue',
    HEALTH_MENUS: '/health/menus',
    HEALTH_MEDITATION: '/health/meditation',
    HEALTH_STUDY_TECHNIQUE: '/health/study-technique',
    HEALTH_CHECKIN: '/health/checkin',                // POST · guardar check-in del día (upsert)
    HEALTH_CHECKIN_GET: '/health/checkin',            // GET  · check-in del día (?localDate=YYYY-MM-DD)

    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        OAUTH: '/auth/oauth',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        ME: '/auth/me',

        OTP_SEND: '/auth/otp/send',
        OTP_VERIFY: '/auth/otp/verify',

        PASSWORD_RESET_REQUEST: '/auth/password/reset-request',
        PASSWORD_RESET_CONFIRM: '/auth/password/reset-confirm',
        PASSWORD_RESET_REDIRECT: '/auth/password/reset-redirect',

        BIOMETRIC_CHALLENGE: '/auth/biometric/challenge',
        BIOMETRIC_LINK: '/auth/biometric/link',
        BIOMETRIC_LOGIN: '/auth/biometric/login',

        TERMS_ACCEPT: '/auth/terms/accept',

        PROFILE_UPDATE: '/auth/profile',
        DELETE_ACCOUNT: '/auth/me',
    },

    DASHBOARD: {
        SUMMARY: '/dashboard/summary',

        NOTIFICATIONS: '/dashboard/notifications',
        NOTIFICATION_READ: '/dashboard/notifications/:id/read',
        NOTIFICATIONS_READ_ALL: '/dashboard/notifications/read-all',
        NEXT_NUDGE: '/dashboard/notifications/next-nudge',

        GAMIFICATION: '/dashboard/gamification',
        GAMIFICATION_ACTIVITY: '/dashboard/gamification/activity',
    },

    PLANNING: {
        SUMMARY: '/planning/summary',
        PLAN: '/planning/plan',
        TASKS: '/planning/tasks',
        TASK_TOGGLE: '/planning/tasks/:id/toggle',
        WEEK: '/planning/week',
        MACRO: '/planning/macro',
        AGENDA: '/planning/agenda',
        AGENDA_DELETE: '/planning/agenda/:id',
    },

    TRAINING: {
        MOCKS:              '/training/mocks',
        MOCK_DETAIL:        '/training/mocks/:id',
        MOCK_QUESTIONS:     '/training/mocks/:id/questions',
        GENERATE:           '/training/generate',
        // Cache-first (estrategia B · gaps-22-09-26) — devuelve preguntas cacheadas
        // al instante (~3 s) y opcionalmente un jobId para completar el resto en background.
        FROM_CACHE:         '/training/from-cache',
        // Streaming (Fase 2 · gaps-15-09-26)
        GENERATE_STREAM:    '/training/generate-stream',
        JOB_STATUS:         '/training/job/:jobId',
        SESSION_QUESTIONS:  '/training/session/:sessionId',
        SESSION_ANSWER:     '/training/session/:sessionId/answer',
        PHOTO_TEST:         '/training/photo-test',
        SURGICAL:           '/training/surgical',
        ATTEMPTS:           '/training/attempts',
        ERROR_PATTERNS:     '/training/error-patterns',
        BOOKMARKS:          '/training/bookmarks',
        BOOKMARK_DELETE:    '/training/bookmarks/:id',
        HINT:               '/training/hint',
        QUESTION_REPORT:    '/training/questions/:id/report',
        QUESTION_RATE:      '/training/questions/:id/rate',
        MOCK_PROGRESS:      '/training/mocks/progress',
        LAW_VIEW:           '/training/law-view',
        TOPICS:             '/training/topics',
        TOPICS_INVENTORY:   '/training/topics-inventory',
        LEVEL_TEST:         '/training/level-test',
        // Banco de exámenes oficiales (Bloque 6.6 · Motor IA)
        BANK_EXAMS:         '/training/bank/exams',
        BANK_EXAM_UPLOAD:   '/training/bank/exams/upload',
        BANK_EXAM_JOB:      '/training/bank/exams/jobs/:jobId',
        BANK_MOCK_START:    '/training/bank/mock-exams',
        BANK_MOCK_RESULT:   '/training/bank/mock-exams/:sessionId/result',
    },

    BOE: {
        FEED:                     '/boe/feed',
        REGULATIONS:              '/boe/regulations',
        REGULATION:               '/boe/regulations/:id',
        CATALOG_SEARCH:           '/boe/catalog/search',
        CATALOG_SYNC:             '/boe/catalog/sync',
        CHANGE_DETAIL:            '/boe/changes/:id',
        CHANGE_COMPARISON:        '/boe/changes/:id/comparison',
        CHANGE_MINI_TEST:         '/boe/changes/:id/mini-test',
        CHANGE_MINI_TEST_ANSWER:  '/boe/changes/:id/mini-test/answer',
        CHANGE_MINI_TEST_COMPLETE:'/boe/changes/:id/mini-test/complete',
        CHANGE_READ:              '/boe/changes/:id/read',
        CHANGE_BOOKMARK:          '/boe/changes/:id/bookmark',
        SYNC:                     '/boe/sync',
    },

    TUTOR: {
        // Chat con Tutor IA
        CONVERSATIONS:        '/tutor/conversations',
        CONVERSATION:         '/tutor/conversations/:id',
        MESSAGES:             '/tutor/conversations/:id/messages',
        // Flashcards
        DECKS:                '/tutor/flashcards/decks',
        DECK:                 '/tutor/flashcards/decks/:id',
        DECK_REVIEW:          '/tutor/flashcards/decks/:id/reviews',
        // Podcast
        EPISODES:             '/tutor/podcast/episodes',
        EPISODE:              '/tutor/podcast/episodes/:id',
        PODCAST_PROGRESS:     '/tutor/podcast/progress/:episodeId',
        PODCAST_GENERATE:     '/tutor/podcast/generate',
        PODCAST_AUDIO:        '/tutor/podcast/audio/:filename',
        // Resúmenes
        SUMMARIES:            '/tutor/summaries',
        SUMMARY:              '/tutor/summaries/:topicId',
    },

    NOTES: {
        // Bloque 9 · Factoría de Apuntes
        LIST:              '/notes',
        DETAIL:            '/notes/:id',
        UPLOAD:            '/notes/upload',
        STATUS:            '/notes/:id/status',
        TAGS:              '/notes/:id/tags',
        GENERATE_TEST:     '/notes/:id/generate-test',
    },

    STORE: {
        BALANCE:                '/store/balance',
        PRODUCTS:               '/store/products',
        PRODUCT:                '/store/products/:id',
        REDEEM:                 '/store/products/:id/redeem',
        DISCOUNTS:              '/store/discounts',
        DISCOUNT_REDEEM:        '/store/discounts/:id/redeem',
        WALLET:                 '/store/wallet',
        WALLET_ITEM:            '/store/wallet/:id',
        COMMUNITY_TESTS:        '/store/community-tests',
        COMMUNITY_TEST:         '/store/community-tests/:id',
        COMMUNITY_TEST_PURCHASE:'/store/community-tests/:id/purchase',
    },

    CONFIG: {
        PREFERENCES:       '/config/preferences',
        PRO_STATS:         '/config/pro-stats',
        PRO_STATS_EXPORT:  '/config/pro-stats/export',
        FEEDBACK:          '/config/feedback',
    },

    PUSH: {
        REGISTER_TOKEN: '/push/token',
    },

    MOTIVATION: {
        SUMMARY: '/motivation/summary',
        STREAK: '/motivation/streak',
        RANKING: '/motivation/ranking',
        PROFILE_PASSED: '/motivation/profile/passed',

        CLANS: '/motivation/clans',
        CLAN_MINE: '/motivation/clans/mine',
        CLAN_JOIN: '/motivation/clans/:id/join',
        CLAN_DETAIL: '/motivation/clans/:id',
        CLAN_MESSAGES: '/motivation/clans/:id/messages',
        CLAN_CHALLENGES: '/motivation/clans/:id/challenges',
        CLAN_CHALLENGE_COMPLETE: '/motivation/clans/:id/challenges/:challengeId/complete',
        CLAN_GRADUATES: '/motivation/clans/:id/graduates',
        CLAN_LEAVE: '/motivation/clans/:id/leave',
    },
};

/** Versión actual de los términos de uso — bumpear cuando cambien */
export const TERMS_VERSION = '2026-07-01';
export const PRIVACY_VERSION = '2026-07-01';
