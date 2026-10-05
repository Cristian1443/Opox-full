import { api } from './client';
import { API_ROUTES } from '@opox/constants';

// Formato manual (no toLocaleDateString('sv')): el resultado de Intl depende
// del motor/ICU (Hermes iOS vs Android) y un formato distinto a YYYY-MM-DD
// rompería la racha y los filtros por día.
const localDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Wrappers del bloque 2 · Dashboard. Mismo patrón que authApi: llaman al
 * backend y devuelven { data, error } sin lanzar.
 */

function withQuery(path, params = {}) {
    const query = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
    return query ? `${path}?${query}` : path;
}

export const dashboardApi = {
    getSummary: () => api.get(API_ROUTES.DASHBOARD.SUMMARY, { auth: true }),

    listNotifications: ({ category, cursor, limit } = {}) =>
        api.get(
            withQuery(API_ROUTES.DASHBOARD.NOTIFICATIONS, { category, cursor, limit }),
            { auth: true },
        ),

    markNotificationRead: (id) =>
        api.post(API_ROUTES.DASHBOARD.NOTIFICATION_READ.replace(':id', id), {}, { auth: true }),

    markAllNotificationsRead: () =>
        api.post(API_ROUTES.DASHBOARD.NOTIFICATIONS_READ_ALL, {}, { auth: true }),

    getNextNudge: () => api.get(API_ROUTES.DASHBOARD.NEXT_NUDGE, { auth: true }),

    getGamification: () => api.get(API_ROUTES.DASHBOARD.GAMIFICATION, { auth: true }),

    registerActivity: (input) =>
        api.post(
            API_ROUTES.DASHBOARD.GAMIFICATION_ACTIVITY,
            { ...input, localDate: input?.localDate ?? localDate() },
            { auth: true },
        ),
};
