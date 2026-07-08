import { api } from './client';
import { API_ROUTES } from '@opox/constants';

/** Wrappers del bloque 4 · Planificación. */
export const planningApi = {
    getSummary: () => api.get(API_ROUTES.PLANNING.SUMMARY, { auth: true }),

    getPlan: () => api.get(API_ROUTES.PLANNING.PLAN, { auth: true }),
    updatePlan: (input) => api.patch(API_ROUTES.PLANNING.PLAN, input, { auth: true }),

    listTasks: (date) =>
        api.get(date ? `${API_ROUTES.PLANNING.TASKS}?date=${date}` : API_ROUTES.PLANNING.TASKS, { auth: true }),
    createTask: (input) => api.post(API_ROUTES.PLANNING.TASKS, input, { auth: true }),
    toggleTask: (taskId, done) =>
        api.patch(API_ROUTES.PLANNING.TASK_TOGGLE.replace(':id', taskId), { done }, { auth: true }),

    getWeek: ({ weekStart, selectedDate } = {}) => {
        const params = new URLSearchParams();
        if (weekStart) params.set('weekStart', weekStart);
        if (selectedDate) params.set('selectedDate', selectedDate);
        const qs = params.toString();
        return api.get(qs ? `${API_ROUTES.PLANNING.WEEK}?${qs}` : API_ROUTES.PLANNING.WEEK, { auth: true });
    },

    getMacro: () => api.get(API_ROUTES.PLANNING.MACRO, { auth: true }),

    listAgenda: () => api.get(API_ROUTES.PLANNING.AGENDA, { auth: true }),
    createAgendaDate: (input) => api.post(API_ROUTES.PLANNING.AGENDA, input, { auth: true }),
};
