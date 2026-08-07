declare const API_ROUTES: {
    readonly HEALTH: string;

    readonly AUTH: {
        readonly REGISTER: string;
        readonly LOGIN: string;
        readonly OAUTH: string;
        readonly LOGOUT: string;
        readonly REFRESH: string;
        readonly ME: string;
        readonly OTP_SEND: string;
        readonly OTP_VERIFY: string;
        readonly PASSWORD_RESET_REQUEST: string;
        readonly PASSWORD_RESET_CONFIRM: string;
        readonly BIOMETRIC_CHALLENGE: string;
        readonly BIOMETRIC_LINK: string;
        readonly BIOMETRIC_LOGIN: string;
        readonly TERMS_ACCEPT: string;
        readonly PROFILE_UPDATE: string;
        readonly DELETE_ACCOUNT: string;
    };

    readonly DASHBOARD: {
        readonly SUMMARY: string;
        readonly NOTIFICATIONS: string;
        readonly NOTIFICATION_READ: string;
        readonly NOTIFICATIONS_READ_ALL: string;
        readonly NEXT_NUDGE: string;
        readonly GAMIFICATION: string;
        readonly GAMIFICATION_ACTIVITY: string;
    };

    readonly PLANNING: {
        readonly SUMMARY: string;
        readonly PLAN: string;
        readonly TASKS: string;
        readonly TASK_TOGGLE: string;
        readonly WEEK: string;
        readonly MACRO: string;
        readonly AGENDA: string;
    };

    readonly TRAINING: {
        readonly MOCKS: string;
        readonly MOCK_DETAIL: string;
        readonly MOCK_QUESTIONS: string;
        readonly GENERATE: string;
        readonly PHOTO_TEST: string;
        readonly SURGICAL: string;
        readonly ATTEMPTS: string;
        readonly ERROR_PATTERNS: string;
        readonly BOOKMARKS: string;
        readonly BOOKMARK_DELETE: string;
        readonly HINT: string;
        readonly QUESTION_REPORT: string;
        readonly TOPICS: string;
    };

    readonly BOE: {
        readonly FEED: string;
        readonly REGULATIONS: string;
        readonly REGULATION: string;
        readonly CHANGE_DETAIL: string;
        readonly CHANGE_COMPARISON: string;
        readonly CHANGE_MINI_TEST: string;
        readonly CHANGE_MINI_TEST_COMPLETE: string;
        readonly CHANGE_READ: string;
        readonly CHANGE_BOOKMARK: string;
    };

    readonly TUTOR: {
        readonly CONVERSATIONS: string;
        readonly CONVERSATION: string;
        readonly MESSAGES: string;
        readonly DECKS: string;
        readonly DECK: string;
        readonly DECK_REVIEW: string;
        readonly EPISODES: string;
        readonly EPISODE: string;
        readonly PODCAST_PROGRESS: string;
        readonly SUMMARIES: string;
        readonly SUMMARY: string;
    };

    readonly NOTES: {
        readonly LIST: string;
        readonly DETAIL: string;
        readonly UPLOAD: string;
        readonly STATUS: string;
        readonly TAGS: string;
        readonly GENERATE_TEST: string;
    };

    readonly MOTIVATION: {
        readonly SUMMARY: string;
        readonly STREAK: string;
        readonly RANKING: string;
        readonly PROFILE_PASSED: string;
        readonly CLANS: string;
        readonly CLAN_MINE: string;
        readonly CLAN_JOIN: string;
        readonly CLAN_DETAIL: string;
        readonly CLAN_MESSAGES: string;
        readonly CLAN_CHALLENGES: string;
        readonly CLAN_CHALLENGE_COMPLETE: string;
        readonly CLAN_GRADUATES: string;
    };
};

declare const TERMS_VERSION: string;
declare const PRIVACY_VERSION: string;

export { API_ROUTES, TERMS_VERSION, PRIVACY_VERSION };
