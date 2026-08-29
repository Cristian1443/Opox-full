import type {
    IPlanningRepository,
    IDashboardRepository,
    StudyTask,
    UserGamification,
    TaskKind,
    TimeOfDay,
} from '../../domain';
import { todayIso, applyIntensity } from './dateUtils';

const DAILY_GOAL_POINTS = 40;

export class ListTasksUseCase {
    constructor(private readonly planningRepo: IPlanningRepository) { }

    execute(input: { userId: string; date?: string; localDate?: string }): Promise<StudyTask[]> {
        return this.planningRepo.listTasks({ userId: input.userId, date: input.date ?? input.localDate ?? todayIso() });
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
        private readonly onGoalCompleted?: (userId: string) => Promise<void>,
    ) { }

    async execute(input: { userId: string; taskId: string; done: boolean; localDate?: string }): Promise<ToggleTaskResult> {
        const task = await this.planningRepo.toggleTask(input);
        if (!input.done) return { task, goalCompleted: false };

        const [plan, todayTasks] = await Promise.all([
            this.planningRepo.getPlan(input.userId),
            this.planningRepo.listTasks({ userId: input.userId, date: task.taskDate }),
        ]);
        const completedCount = todayTasks.filter((t) => t.done).length;

        // Umbral exacto: dispara los puntos y el pop-up solo la vez que se cruza
        // el objetivo (ajustado por intensidad), no en cada toggle posterior.
        const goalCount = applyIntensity(plan.testsPerDay, plan.intensity);
        const crossedGoal = completedCount === goalCount;

        // La racha debe subir con la primera tarea del día, no esperar al objetivo.
        // Puntos: 0 en cada tarea, DAILY_GOAL_POINTS solo al cruzar el umbral.
        const gamification = await this.dashboardRepo.registerActivity({
            userId: input.userId,
            reason: crossedGoal ? 'daily_goal_completed' : 'task_completed',
            points: crossedGoal ? DAILY_GOAL_POINTS : 0,
            localDate: input.localDate,
        });

        if (crossedGoal) {
            await this.onGoalCompleted?.(input.userId).catch(() => {});
            return { task, goalCompleted: true, gamification };
        }

        return { task, goalCompleted: false, gamification };
    }
}
