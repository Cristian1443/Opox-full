import { StudyPlan, StudyTask, PlanDate, PlanIntensity, TaskKind, TimeOfDay, PlanDateKind } from '../entities';

/** Contrato del repositorio del Bloque 4 · Planificación. */
export interface IPlanningRepository {
    // ─── Plan (ajustes) ───────────────────────────
    getPlan(userId: string): Promise<StudyPlan>;
    updatePlan(input: {
        userId: string;
        testsPerDay?: number;
        studyDays?: number[];
        intensity?: PlanIntensity;
        examDate?: string | null;
    }): Promise<StudyPlan>;

    // ─── Tareas ───────────────────────────────────
    listTasks(input: { userId: string; date: string }): Promise<StudyTask[]>;
    listTasksInRange(input: { userId: string; from: string; to: string }): Promise<StudyTask[]>;
    createTask(input: {
        userId: string;
        taskDate: string;
        title: string;
        subtitle?: string | null;
        kind?: TaskKind;
        timeOfDay?: TimeOfDay | null;
    }): Promise<StudyTask>;
    toggleTask(input: { userId: string; taskId: string; done: boolean }): Promise<StudyTask>;

    /** Última fecha (YYYY-MM-DD) con al menos una tarea completada, o null. */
    getLastActivityDate(userId: string): Promise<string | null>;

    // ─── Agenda ───────────────────────────────────
    listDates(userId: string): Promise<PlanDate[]>;
    createDate(input: {
        userId: string;
        eventDate: string;
        title: string;
        subtitle?: string | null;
        kind?: PlanDateKind;
    }): Promise<PlanDate>;
}
