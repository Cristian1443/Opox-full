import type { Request, Response, NextFunction } from 'express';
import type {
    ApiSuccessResponse,
    StudyPlanDTO,
    StudyTaskDTO,
    PlanDateDTO,
    WeekResultDTO,
    MacroResultDTO,
    PlanningSummaryDTO,
    ToggleTaskResultDTO,
    TrainingTopic,
} from '@opox/types';
import type {
    GetPlanningSummaryUseCase,
    GetPlanUseCase,
    UpdatePlanUseCase,
    ListTasksUseCase,
    CreateTaskUseCase,
    ToggleTaskUseCase,
    GetWeekUseCase,
    GetMacroUseCase,
    ListAgendaUseCase,
    CreateAgendaDateUseCase,
    ToggleTaskResult,
    ListTopicsUseCase,
} from '../../application';
import type { StudyPlan, StudyTask, PlanDate } from '../../domain';
import type { WeekResult } from '../../application/planning/WeekUseCase';
import type { MacroResult, MacroPhase } from '../../application/planning/MacroUseCase';
import type { PlanningSummary } from '../../application/planning/GetPlanningSummaryUseCase';

// Pesos de las fases — deben coincidir con los de MacroUseCase.PHASE_DEFS
const PHASE_WEIGHTS = [0.35, 0.30, 0.25, 0.10];

/** Enriquece las fases macro con los temas del temario distribuidos proporcionalmente. */
function enrichMacroWithTopics(
    macro: MacroResult,
    topics: TrainingTopic[],
): MacroResult & { phases: Array<MacroPhase & { topics: { topicId: string; name: string }[] }> } {
    let idx = 0;
    const phases = macro.phases.map((phase, i) => {
        const count = Math.max(1, Math.round(topics.length * (PHASE_WEIGHTS[i] ?? 0.1)));
        const phaseTopics = topics.slice(idx, Math.min(idx + count, topics.length));
        idx += count;
        return { ...phase, topics: phaseTopics.map((t) => ({ topicId: t.topicId, name: t.label })) };
    });
    return { ...macro, phases };
}

/** Controller del Bloque 4 · Planificación. Mismo patrón que Auth/Dashboard. */
export class PlanningController {
    constructor(
        private readonly deps: {
            getSummary: GetPlanningSummaryUseCase;
            getPlan: GetPlanUseCase;
            updatePlan: UpdatePlanUseCase;
            listTasks: ListTasksUseCase;
            createTask: CreateTaskUseCase;
            toggleTask: ToggleTaskUseCase;
            getWeek: GetWeekUseCase;
            getMacro: GetMacroUseCase;
            listTopics: ListTopicsUseCase;
            listAgenda: ListAgendaUseCase;
            createAgendaDate: CreateAgendaDateUseCase;
        },
    ) { }

    // ─── Helpers de serialización ─────────────────

    private serializePlan(plan: StudyPlan): StudyPlanDTO {
        return {
            testsPerDay: plan.testsPerDay,
            studyDays: plan.studyDays,
            intensity: plan.intensity,
            examDate: plan.examDate,
        };
    }

    private serializeTask(task: StudyTask): StudyTaskDTO {
        return {
            id: task.id,
            taskDate: task.taskDate,
            title: task.title,
            ...(task.subtitle && { subtitle: task.subtitle }),
            kind: task.kind,
            ...(task.timeOfDay && { timeOfDay: task.timeOfDay }),
            done: task.done,
        };
    }

    private serializeDate(date: PlanDate): PlanDateDTO {
        return {
            id: date.id,
            eventDate: date.eventDate,
            title: date.title,
            ...(date.subtitle && { subtitle: date.subtitle }),
            kind: date.kind,
        };
    }

    private serializeWeek(week: WeekResult): WeekResultDTO {
        return {
            weekStart: week.weekStart,
            days: week.days,
            selectedDate: week.selectedDate,
            selectedTasks: week.selectedTasks.map((t) => this.serializeTask(t)),
            ritmoPercent: week.ritmoPercent,
        };
    }

    private serializeMacro(macro: MacroResult | null): MacroResultDTO | null {
        return macro;
    }

    private serializeSummary(summary: PlanningSummary): PlanningSummaryDTO {
        return {
            today: summary.today,
            week: summary.week,
            macro: this.serializeMacro(summary.macro),
            alerts: summary.alerts,
        };
    }

    private serializeToggleResult(result: ToggleTaskResult): ToggleTaskResultDTO {
        return {
            task: this.serializeTask(result.task),
            goalCompleted: result.goalCompleted,
            ...(result.gamification && {
                gamification: {
                    currentStreak: result.gamification.currentStreak,
                    longestStreak: result.gamification.longestStreak,
                    opopointsBalance: result.gamification.opopointsBalance,
                },
            }),
        };
    }

    private ok<T>(res: Response, status: number, data: T): void {
        const body: ApiSuccessResponse<T> = { ok: true, data };
        res.status(status).json(body);
    }

    // ─── Handlers ─────────────────────────────────

    getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const localDate = req.query['localDate'] as string | undefined;
            const summary = await this.deps.getSummary.execute(req.authUser!.id, { localDate });
            this.ok(res, 200, this.serializeSummary(summary));
        } catch (err) { next(err); }
    };

    getPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const plan = await this.deps.getPlan.execute(req.authUser!.id);
            this.ok(res, 200, this.serializePlan(plan));
        } catch (err) { next(err); }
    };

    updatePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const plan = await this.deps.updatePlan.execute({ userId: req.authUser!.id, ...req.body });
            this.ok(res, 200, this.serializePlan(plan));
        } catch (err) { next(err); }
    };

    listTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const query = req.validatedQuery as { date?: string; localDate?: string };
            const tasks = await this.deps.listTasks.execute({
                userId: req.authUser!.id,
                date: query.date,
                localDate: query.localDate,
            });
            this.ok(res, 200, tasks.map((t) => this.serializeTask(t)));
        } catch (err) { next(err); }
    };

    createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const task = await this.deps.createTask.execute({ userId: req.authUser!.id, ...req.body });
            this.ok(res, 201, this.serializeTask(task));
        } catch (err) { next(err); }
    };

    toggleTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.deps.toggleTask.execute({
                userId: req.authUser!.id,
                taskId: req.params['id'] as string,
                done: req.body.done,
                localDate: req.body.localDate,
            });
            this.ok(res, 200, this.serializeToggleResult(result));
        } catch (err) { next(err); }
    };

    getWeek = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const query = req.validatedQuery as { weekStart?: string; selectedDate?: string; localDate?: string };
            const week = await this.deps.getWeek.execute({ userId: req.authUser!.id, ...query });
            this.ok(res, 200, this.serializeWeek(week));
        } catch (err) { next(err); }
    };

    getMacro = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const oposicion = (req.query['oposicion'] as string) || 'justicia-tramitacion';
            const [macro, topics] = await Promise.all([
                this.deps.getMacro.execute(req.authUser!.id),
                this.deps.listTopics.execute(oposicion),
            ]);
            const enriched = macro ? enrichMacroWithTopics(macro, topics) : null;
            this.ok(res, 200, enriched);
        } catch (err) { next(err); }
    };

    listAgenda = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dates = await this.deps.listAgenda.execute(req.authUser!.id);
            this.ok(res, 200, dates.map((d) => this.serializeDate(d)));
        } catch (err) { next(err); }
    };

    createAgendaDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const date = await this.deps.createAgendaDate.execute({ userId: req.authUser!.id, ...req.body });
            this.ok(res, 201, this.serializeDate(date));
        } catch (err) { next(err); }
    };
}
