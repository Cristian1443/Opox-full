import { api } from './client';
import { API_ROUTES } from '@opox/constants';

/** Fecha local del dispositivo en formato YYYY-MM-DD (evita el bug de timezone UTC). */
const localDate = () => new Date().toLocaleDateString('sv');

/** Wrappers del bloque 4 · Planificación. */
export const planningApi = {
    getSummary: () =>
        api.get(`${API_ROUTES.PLANNING.SUMMARY}?localDate=${localDate()}`, { auth: true }),

    getPlan: () => api.get(API_ROUTES.PLANNING.PLAN, { auth: true }),
    updatePlan: (input) => api.patch(API_ROUTES.PLANNING.PLAN, input, { auth: true }),

    listTasks: (date) => {
        const params = new URLSearchParams();
        if (date) params.set('date', date);
        else params.set('localDate', localDate());
        return api.get(`${API_ROUTES.PLANNING.TASKS}?${params}`, { auth: true });
    },
    createTask: (input) => api.post(API_ROUTES.PLANNING.TASKS, input, { auth: true }),
    toggleTask: (taskId, done) =>
        api.patch(API_ROUTES.PLANNING.TASK_TOGGLE.replace(':id', taskId), { done, localDate: localDate() }, { auth: true }),

    getWeek: ({ weekStart, selectedDate } = {}) => {
        const params = new URLSearchParams({ localDate: localDate() });
        if (weekStart) params.set('weekStart', weekStart);
        if (selectedDate) params.set('selectedDate', selectedDate);
        return api.get(`${API_ROUTES.PLANNING.WEEK}?${params}`, { auth: true });
    },

    getMacro: (oposicion) => {
        const params = new URLSearchParams();
        if (oposicion) params.set('oposicion', oposicion);
        const qs = params.toString();
        return api.get(qs ? `${API_ROUTES.PLANNING.MACRO}?${qs}` : API_ROUTES.PLANNING.MACRO, { auth: true });
    },

    listAgenda: () => api.get(API_ROUTES.PLANNING.AGENDA, { auth: true }),
    createAgendaDate: (input) => api.post(API_ROUTES.PLANNING.AGENDA, input, { auth: true }),
};
