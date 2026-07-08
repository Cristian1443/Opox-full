import type {
    IPlanningRepository,
    IDashboardRepository,
    StudyTask,
    UserGamification,
    TaskKind,
    TimeOfDay,
} from '../../domain';
import { todayIso } from './dateUtils';

const DAILY_GOAL_POINTS = 40;

export class ListTasksUseCase {
    constructor(private readonly planningRepo: IPlanningRepository) { }

    execute(input: { userId: string; date?: string }): Promise<StudyTask[]> {
        return this.planningRepo.listTasks({ userId: input.userId, date: input.date ?? todayIso() });
    }
}

export class CreateTaskUseCase {
    constructor(private readonly planningRepo: IPlanningRepository) { }

    execute(input: {
        userId: string;
        taskDate: string;
        title: string;
        subtitle?: string | null;
        kind?: TaskKind;
        timeOfDay?: TimeOfDay | null;
    }): Promise<StudyTask> {
        return this.planningRepo.createTask(input);
    }
}

export interface ToggleTaskResult {
    task: StudyTask;
    goalCompleted: boolean;
    gamification?: UserGamification;
}

/**
 * Al completar una tarea, si con ella se alcanza el objetivo diario
 * (tests_per_day) por primera vez ese día, dispara el mismo sistema de
 * racha/Opopoints del Bloque 2 — así el pop-up "Objetivo cumplido" (4.2·ok)
 * muestra la racha y los puntos reales.
 */
export class ToggleTaskUseCase {
    constructor(
        private readonly planningRepo: IPlanningRepository,
        private readonly dashboardRepo: IDashboardRepository,
    ) { }

    async execute(input: { userId: string; taskId: string; done: boolean }): Promise<ToggleTaskResult> {
        const task = await this.planningRepo.toggleTask(input);
        if (!input.done) return { task, goalCompleted: false };

        const [plan, todayTasks] = await Promise.all([
            this.planningRepo.getPlan(input.userId),
            this.planningRepo.listTasks({ userId: input.userId, date: task.taskDate }),
        ]);
        const completedCount = todayTasks.filter((t) => t.done).length;

        // Umbral exacto: dispara solo la vez que se cruza el objetivo, no en
        // cada toggle posterior sobre el mismo día.
        if (completedCount === plan.testsPerDay) {
            const gamification = await this.dashboardRepo.registerActivity({
                userId: input.userId,
                reason: 'daily_goal_completed',
                points: DAILY_GOAL_POINTS,
            });
            return { task, goalCompleted: true, gamification };
        }

        return { task, goalCompleted: false };
    }
}
