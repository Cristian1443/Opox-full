/**
 * Rutas HTTP del backend, compartidas con el mobile para evitar strings
 * dispersos y drift entre cliente y servidor.
 */

export const API_ROUTES = {
    HEALTH: '/health',

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

        BIOMETRIC_CHALLENGE: '/auth/biometric/challenge',
        BIOMETRIC_LINK: '/auth/biometric/link',
        BIOMETRIC_LOGIN: '/auth/biometric/login',

        TERMS_ACCEPT: '/auth/terms/accept',

        PROFILE_UPDATE: '/auth/profile',
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
    },
};

/** Versión actual de los términos de uso — bumpear cuando cambien */
export const TERMS_VERSION = '2026-07-01';
export const PRIVACY_VERSION = '2026-07-01';
