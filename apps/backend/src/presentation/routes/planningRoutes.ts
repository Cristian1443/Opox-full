import { Router, type RequestHandler } from 'express';
import { API_ROUTES } from '@opox/constants';
import type { PlanningController } from '../controllers';
import { validateBody, validateQuery } from '../middleware';
import {
    updatePlanSchema,
    listTasksQuerySchema,
    createTaskSchema,
    toggleTaskSchema,
    weekQuerySchema,
    createAgendaDateSchema,
} from '../validators';

/** Todas las rutas del Bloque 4 requieren sesión. */
export function createPlanningRouter(
    controller: PlanningController,
    authMiddleware: RequestHandler,
): Router {
    const r = Router();

    r.get(API_ROUTES.PLANNING.SUMMARY, authMiddleware, controller.getSummary);

    r.get(API_ROUTES.PLANNING.PLAN, authMiddleware, controller.getPlan);
    r.patch(
        API_ROUTES.PLANNING.PLAN,
        authMiddleware,
        validateBody(updatePlanSchema),
        controller.updatePlan,
    );

    r.get(
        API_ROUTES.PLANNING.TASKS,
        authMiddleware,
        validateQuery(listTasksQuerySchema),
        controller.listTasks,
    );
    r.post(
        API_ROUTES.PLANNING.TASKS,
        authMiddleware,
        validateBody(createTaskSchema),
        controller.createTask,
    );
    r.patch(
        API_ROUTES.PLANNING.TASK_TOGGLE,
        authMiddleware,
        validateBody(toggleTaskSchema),
        controller.toggleTask,
    );

    r.get(
        API_ROUTES.PLANNING.WEEK,
        authMiddleware,
        validateQuery(weekQuerySchema),
        controller.getWeek,
    );

    r.get(API_ROUTES.PLANNING.MACRO, authMiddleware, controller.getMacro);

    r.get(API_ROUTES.PLANNING.AGENDA, authMiddleware, controller.listAgenda);
    r.post(
        API_ROUTES.PLANNING.AGENDA,
        authMiddleware,
        validateBody(createAgendaDateSchema),
        controller.createAgendaDate,
    );

    return r;
}
