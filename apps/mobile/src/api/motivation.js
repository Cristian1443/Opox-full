import { api } from './client';
import { API_ROUTES } from '@opox/constants';

/** Wrappers del bloque 5 · Motivación y Gamificación. */
export const motivationApi = {
    getSummary: () => api.get(API_ROUTES.MOTIVATION.SUMMARY, { auth: true }),
    getStreak: () => api.get(API_ROUTES.MOTIVATION.STREAK, { auth: true }),
    getRanking: (scope) => api.get(`${API_ROUTES.MOTIVATION.RANKING}?scope=${scope}`, { auth: true }),
    markExamPassed: () => api.post(API_ROUTES.MOTIVATION.PROFILE_PASSED, {}, { auth: true }),

    getMyClan: () => api.get(API_ROUTES.MOTIVATION.CLAN_MINE, { auth: true }),
    listClans: () => api.get(API_ROUTES.MOTIVATION.CLANS, { auth: true }),
    createClan: (input) => api.post(API_ROUTES.MOTIVATION.CLANS, input, { auth: true }),
    joinClan: (clanId) => api.post(API_ROUTES.MOTIVATION.CLAN_JOIN.replace(':id', clanId), {}, { auth: true }),
    getClanDetail: (clanId) => api.get(API_ROUTES.MOTIVATION.CLAN_DETAIL.replace(':id', clanId), { auth: true }),

    listClanMessages: (clanId, after) => {
        const base = API_ROUTES.MOTIVATION.CLAN_MESSAGES.replace(':id', clanId);
        return api.get(after ? `${base}?after=${encodeURIComponent(after)}` : base, { auth: true });
    },
    sendClanMessage: (clanId, body) =>
        api.post(API_ROUTES.MOTIVATION.CLAN_MESSAGES.replace(':id', clanId), { body }, { auth: true }),

    listClanChallenges: (clanId) =>
        api.get(API_ROUTES.MOTIVATION.CLAN_CHALLENGES.replace(':id', clanId), { auth: true }),
    createClanChallenge: (clanId, input) =>
        api.post(API_ROUTES.MOTIVATION.CLAN_CHALLENGES.replace(':id', clanId), input, { auth: true }),
    completeChallenge: (clanId, challengeId) =>
        api.post(
            API_ROUTES.MOTIVATION.CLAN_CHALLENGE_COMPLETE.replace(':id', clanId).replace(':challengeId', challengeId),
            {},
            { auth: true },
        ),

    listGraduates: (clanId) =>
        api.get(API_ROUTES.MOTIVATION.CLAN_GRADUATES.replace(':id', clanId), { auth: true }),
};
