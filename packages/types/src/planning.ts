/**
 * Tipos compartidos del Bloque 4 · Planificación.
 */

export type PlanIntensity = 'low' | 'medium' | 'high';
export type TaskKind = 'test' | 'tutor' | 'simulacro' | 'other';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening';
export type PlanDateKind = 'exam_deadline' | 'exam' | 'custom';
export type DayStatus = 'completed' | 'partial' | 'today' | 'upcoming';
export type PhaseStatus = 'done' | 'current' | 'upcoming';

export interface StudyPlanDTO {
    testsPerDay: number;
    studyDays: number[];
    intensity: PlanIntensity;
    examDate: string | null;
}

export interface StudyTaskDTO {
    id: string;
    taskDate: string;
    title: string;
    subtitle?: string;
    kind: TaskKind;
    timeOfDay?: TimeOfDay;
    done: boolean;
}

export interface PlanDateDTO {
    id: string;
    eventDate: string;
    title: string;
    subtitle?: string;
    kind: PlanDateKind;
}

export interface WeekDaySummaryDTO {
    date: string;
    weekday: number;
    status: DayStatus;
}

export interface WeekResultDTO {
    weekStart: string;
    days: WeekDaySummaryDTO[];
    selectedDate: string;
    selectedTasks: StudyTaskDTO[];
    ritmoPercent: number | null;
}

export interface MacroPhaseDTO {
    key: string;
    title: string;
    status: PhaseStatus;
}

export interface MacroResultDTO {
    examDate: string;
    daysLeft: number;
    monthsLeft: number;
    phases: MacroPhaseDTO[];
}

export interface PlanningSummaryDTO {
    today: {
        completedCount: number;
        goalCount: number;
        percent: number;
    };
    week: { days: WeekDaySummaryDTO[] };
    macro: MacroResultDTO | null;
    alerts: {
        daysSinceLastActivity: number | null;
        examSoonDays: number | null;
    };
}

export interface ToggleTaskResultDTO {
    task: StudyTaskDTO;
    goalCompleted: boolean;
    gamification?: { currentStreak: number; longestStreak: number; opopointsBalance: number };
}

// ─── Requests ────────────────────────────────────

export interface UpdatePlanRequest {
    testsPerDay?: number;
    studyDays?: number[];
    intensity?: PlanIntensity;
    examDate?: string | null;
}

export interface CreateTaskRequest {
    taskDate: string;
    title: string;
    subtitle?: string;
    kind?: TaskKind;
    timeOfDay?: TimeOfDay;
}

export interface CreateAgendaDateRequest {
    eventDate: string;
    title: string;
    subtitle?: string;
    kind?: PlanDateKind;
}
