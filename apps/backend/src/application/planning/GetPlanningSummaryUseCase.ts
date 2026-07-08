import type { IPlanningRepository } from '../../domain';
import { GetWeekUseCase, WeekDaySummary } from './WeekUseCase';
import { GetMacroUseCase, MacroResult } from './MacroUseCase';
import { todayIso, daysBetween } from './dateUtils';

const EXAM_SOON_THRESHOLD_DAYS = 30;

export interface PlanningSummary {
    today: {
        completedCount: number;
        goalCount: number;
        percent: number;
    };
    week: { days: WeekDaySummary[] };
    macro: MacroResult | null;
    alerts: {
        /** null si nunca ha completado nada (usuario nuevo, no se alarma) */
        daysSinceLastActivity: number | null;
        /** null si no hay examDate o falta más de 30 días */
        examSoonDays: number | null;
    };
}

export class GetPlanningSummaryUseCase {
    constructor(
        private readonly planningRepo: IPlanningRepository,
        private readonly getWeek: GetWeekUseCase,
        private readonly getMacro: GetMacroUseCase,
    ) { }

    async execute(userId: string): Promise<PlanningSummary> {
        const today = todayIso();
        const [plan, todayTasks, week, macro, lastActivityDate] = await Promise.all([
            this.planningRepo.getPlan(userId),
            this.planningRepo.listTasks({ userId, date: today }),
            this.getWeek.execute({ userId }),
            this.getMacro.execute(userId),
            this.planningRepo.getLastActivityDate(userId),
        ]);

        const completedCount = todayTasks.filter((t) => t.done).length;
        const goalCount = plan.testsPerDay;

        const daysSinceLastActivity = lastActivityDate
            ? daysBetween(lastActivityDate, today)
            : null;

        let examSoonDays: number | null = null;
        if (macro && macro.daysLeft > 0 && macro.daysLeft <= EXAM_SOON_THRESHOLD_DAYS) {
            examSoonDays = macro.daysLeft;
        }

        return {
            today: {
                completedCount,
                goalCount,
                percent: goalCount > 0 ? Math.min(Math.round((completedCount / goalCount) * 100), 100) : 0,
            },
            week: { days: week.days },
            macro,
            alerts: { daysSinceLastActivity, examSoonDays },
        };
    }
}
