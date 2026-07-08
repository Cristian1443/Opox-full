import type { IPlanningRepository, StudyTask } from '../../domain';
import { todayIso, mondayOf, addDays } from './dateUtils';

export type DayStatus = 'completed' | 'partial' | 'today' | 'upcoming';

export interface WeekDaySummary {
    date: string;
    weekday: number; // 1=lunes .. 7=domingo
    status: DayStatus;
}

export interface WeekResult {
    weekStart: string;
    days: WeekDaySummary[];
    selectedDate: string;
    selectedTasks: StudyTask[];
    /** % de tareas completadas de la semana hasta hoy; null si no hay tareas. */
    ritmoPercent: number | null;
}

export class GetWeekUseCase {
    constructor(private readonly planningRepo: IPlanningRepository) { }

    async execute(input: { userId: string; weekStart?: string; selectedDate?: string }): Promise<WeekResult> {
        const today = todayIso();
        const weekStart = input.weekStart ?? mondayOf(today);
        const weekEnd = addDays(weekStart, 6);
        const selectedDate = input.selectedDate ?? today;

        const [plan, tasks] = await Promise.all([
            this.planningRepo.getPlan(input.userId),
            this.planningRepo.listTasksInRange({ userId: input.userId, from: weekStart, to: weekEnd }),
        ]);

        const days: WeekDaySummary[] = [];
        let totalCount = 0;
        let doneCount = 0;

        for (let i = 0; i < 7; i++) {
            const date = addDays(weekStart, i);
            const weekday = i + 1;
            const dayTasks = tasks.filter((t) => t.taskDate === date);
            totalCount += dayTasks.length;
            doneCount += dayTasks.filter((t) => t.done).length;

            let status: DayStatus;
            if (date === today) {
                status = 'today';
            } else if (date > today) {
                status = 'upcoming';
            } else {
                const isStudyDay = plan.studyDays.includes(weekday);
                const allDone = dayTasks.length > 0 && dayTasks.every((t) => t.done);
                status = allDone || (!isStudyDay && dayTasks.length === 0) ? 'completed' : 'partial';
            }
            days.push({ date, weekday, status });
        }

        return {
            weekStart,
            days,
            selectedDate,
            selectedTasks: tasks
                .filter((t) => t.taskDate === selectedDate)
                .sort((a, b) => a.sortOrder - b.sortOrder),
            ritmoPercent: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : null,
        };
    }
}
