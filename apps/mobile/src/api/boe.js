import { api } from './client';
import { API_ROUTES } from '@opox/constants';

// Cliente HTTP del Bloque 10 · Monitor BOE.
// Todas las respuestas siguen el patrón { data, error } del api client.

const B = API_ROUTES.BOE;
const T = API_ROUTES.TRAINING;

export const boeApi = {
    // ── Feed de cambios (10.1) ────────────────────────────────────────────────
    getFeed: () => api.get(B.FEED, { auth: true }),

    // ── Detalle del cambio (10.2) ─────────────────────────────────────────────
    getDetail: (changeId) =>
        api.get(B.CHANGE_DETAIL.replace(':id', changeId), { auth: true }),

    // ── Comparativa antes/después (10.3) ──────────────────────────────────────
    getComparison: (changeId) =>
        api.get(B.CHANGE_COMPARISON.replace(':id', changeId), { auth: true }),

    // ── Mini-test (10.4) ──────────────────────────────────────────────────────
    getMiniTest: (changeId) =>
        api.get(B.CHANGE_MINI_TEST.replace(':id', changeId), { auth: true }),

    completeMiniTest: (changeId, score, total) =>
        api.post(
            B.CHANGE_MINI_TEST_COMPLETE.replace(':id', changeId),
            { score, total },
            { auth: true },
        ),

    // ── Interacciones ─────────────────────────────────────────────────────────
    markRead: (changeId) =>
        api.post(B.CHANGE_READ.replace(':id', changeId), {}, { auth: true }),

    toggleBookmark: (changeId) =>
        api.post(B.CHANGE_BOOKMARK.replace(':id', changeId), {}, { auth: true }),

    // ── Temas del temario (Bloque 6 + Bloque 10) ──────────────────────────────
    listTopics: (oposicion) =>
        api.get(`${T.TOPICS}?oposicion=${encodeURIComponent(oposicion)}`, { auth: true }),
};
