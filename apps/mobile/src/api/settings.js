import { api } from './client';
import { API_ROUTES } from '@opox/constants';

// Cliente HTTP del Bloque 12 · Configuración.
// Todas las respuestas siguen el patrón { data, error } del api client.

const C = API_ROUTES.CONFIG;

export const settingsApi = {
    // ── Preferencias: tono IA (12.5) + accesibilidad (12.6) ─────────────────
    getPreferences: () =>
        api.get(C.PREFERENCES, { auth: true }),

    updatePreferences: (patch) =>
        api.patch(C.PREFERENCES, patch, { auth: true }),

    // ── Estadísticas Pro (12.7) ───────────────────────────────────────────────
    getProStats: () =>
        api.get(C.PRO_STATS, { auth: true }),

    // ── Exportar informe (12.8) ───────────────────────────────────────────────
    exportProStats: (period = 'month') =>
        api.post(C.PRO_STATS_EXPORT, { period }, { auth: true }),

    // ── Feedback (12.10) ──────────────────────────────────────────────────────
    submitFeedback: ({ type, message }) =>
        api.post(C.FEEDBACK, { type, message }, { auth: true }),
};
