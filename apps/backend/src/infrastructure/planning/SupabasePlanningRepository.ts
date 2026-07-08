import type { SupabaseClient } from '@supabase/supabase-js';
import {
    StudyPlan,
    StudyTask,
    PlanDate,
    StudyTaskNotFoundError,
    type IPlanningRepository,
    type PlanIntensity,
    type TaskKind,
    type TimeOfDay,
    type PlanDateKind,
} from '../../domain';

type PlanRow = {
    user_id: string;
    tests_per_day: number;
    study_days: number[];
    intensity: PlanIntensity;
    exam_date: string | null;
    created_at: string;
    updated_at: string;
};

type TaskRow = {
    id: string;
    user_id: string;
    task_date: string;
    title: string;
    subtitle: string | null;
    kind: TaskKind;
    time_of_day: TimeOfDay | null;
    done: boolean;
    sort_order: number;
    created_at: string;
};

type DateRow = {
    id: string;
    user_id: string;
    event_date: string;
    title: string;
    subtitle: string | null;
    kind: PlanDateKind;
    created_at: string;
};

function toDomainPlan(row: PlanRow): StudyPlan {
    return StudyPlan.create({
        userId: row.user_id,
        testsPerDay: row.tests_per_day,
        studyDays: row.study_days,
        intensity: row.intensity,
        examDate: row.exam_date,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    });
}

function toDomainTask(row: TaskRow): StudyTask {
    return StudyTask.create({
        id: row.id,
        userId: row.user_id,
        taskDate: row.task_date,
        title: row.title,
        subtitle: row.subtitle,
        kind: row.kind,
        timeOfDay: row.time_of_day,
        done: row.done,
        sortOrder: row.sort_order,
        createdAt: new Date(row.created_at),
    });
}

function toDomainDate(row: DateRow): PlanDate {
    return PlanDate.create({
        id: row.id,
        userId: row.user_id,
        eventDate: row.event_date,
        title: row.title,
        subtitle: row.subtitle,
        kind: row.kind,
        createdAt: new Date(row.created_at),
    });
}

/**
 * Implementación de IPlanningRepository usando Supabase.
 * Tablas: `study_plans`, `study_tasks`, `plan_dates`
 * (ver apps/backend/supabase/bloque4_planificacion.sql).
 */
export class SupabasePlanningRepository implements IPlanningRepository {
    constructor(private readonly supabaseAdmin: SupabaseClient) { }

    // ─── Plan ──────────────────────────────────────

    async getPlan(userId: string): Promise<StudyPlan> {
        // Igual patrón que getGamification: upsert idempotente que crea el
        // plan con defaults la primera vez sin pisar uno ya existente.
        const { data, error } = await this.supabaseAdmin
            .from('study_plans')
            .upsert({ user_id: userId }, { onConflict: 'user_id' })
            .select('*')
            .single();
        if (error || !data) throw new Error(`getPlan: ${error?.message}`);
        return toDomainPlan(data as PlanRow);
    }

    async updatePlan(input: {
        userId: string;
        testsPerDay?: number;
        studyDays?: number[];
        intensity?: PlanIntensity;
        examDate?: string | null;
    }): Promise<StudyPlan> {
        await this.getPlan(input.userId); // asegura que la fila exista

        const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (input.testsPerDay !== undefined) patch['tests_per_day'] = input.testsPerDay;
        if (input.studyDays !== undefined) patch['study_days'] = input.studyDays;
        if (input.intensity !== undefined) patch['intensity'] = input.intensity;
        if (input.examDate !== undefined) patch['exam_date'] = input.examDate;

        const { data, error } = await this.supabaseAdmin
            .from('study_plans')
            .update(patch)
            .eq('user_id', input.userId)
            .select('*')
            .single();
        if (error || !data) throw new Error(`updatePlan: ${error?.message}`);
        return toDomainPlan(data as PlanRow);
    }

    // ─── Tareas ────────────────────────────────────

    async listTasks(input: { userId: string; date: string }): Promise<StudyTask[]> {
        const { data, error } = await this.supabaseAdmin
            .from('study_tasks')
            .select('*')
            .eq('user_id', input.userId)
            .eq('task_date', input.date)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });
        if (error) throw new Error(`listTasks: ${error.message}`);
        return ((data ?? []) as TaskRow[]).map(toDomainTask);
    }

    async listTasksInRange(input: { userId: string; from: string; to: string }): Promise<StudyTask[]> {
        const { data, error } = await this.supabaseAdmin
            .from('study_tasks')
            .select('*')
            .eq('user_id', input.userId)
            .gte('task_date', input.from)
            .lte('task_date', input.to)
            .order('task_date', { ascending: true })
            .order('sort_order', { ascending: true });
        if (error) throw new Error(`listTasksInRange: ${error.message}`);
        return ((data ?? []) as TaskRow[]).map(toDomainTask);
    }

    async createTask(input: {
        userId: string;
        taskDate: string;
        title: string;
        subtitle?: string | null;
        kind?: TaskKind;
        timeOfDay?: TimeOfDay | null;
    }): Promise<StudyTask> {
        const { data, error } = await this.supabaseAdmin
            .from('study_tasks')
            .insert({
                user_id: input.userId,
                task_date: input.taskDate,
                title: input.title,
                subtitle: input.subtitle ?? null,
                kind: input.kind ?? 'other',
                time_of_day: input.timeOfDay ?? null,
            })
            .select('*')
            .single();
        if (error || !data) throw new Error(`createTask: ${error?.message}`);
        return toDomainTask(data as TaskRow);
    }

    async toggleTask(input: { userId: string; taskId: string; done: boolean }): Promise<StudyTask> {
        const { data, error } = await this.supabaseAdmin
            .from('study_tasks')
            .update({ done: input.done })
            .eq('id', input.taskId)
            .eq('user_id', input.userId)
            .select('*')
            .maybeSingle();
        if (error) throw new Error(`toggleTask: ${error.message}`);
        if (!data) throw new StudyTaskNotFoundError();
        return toDomainTask(data as TaskRow);
    }

    async getLastActivityDate(userId: string): Promise<string | null> {
        const { data, error } = await this.supabaseAdmin
            .from('study_tasks')
            .select('task_date')
            .eq('user_id', userId)
            .eq('done', true)
            .order('task_date', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw new Error(`getLastActivityDate: ${error.message}`);
        return data ? (data.task_date as string) : null;
    }

    // ─── Agenda ────────────────────────────────────

    async listDates(userId: string): Promise<PlanDate[]> {
        const { data, error } = await this.supabaseAdmin
            .from('plan_dates')
            .select('*')
            .eq('user_id', userId)
            .order('event_date', { ascending: true });
        if (error) throw new Error(`listDates: ${error.message}`);
        return ((data ?? []) as DateRow[]).map(toDomainDate);
    }

    async createDate(input: {
        userId: string;
        eventDate: string;
        title: string;
        subtitle?: string | null;
        kind?: PlanDateKind;
    }): Promise<PlanDate> {
        const { data, error } = await this.supabaseAdmin
            .from('plan_dates')
            .insert({
                user_id: input.userId,
                event_date: input.eventDate,
                title: input.title,
                subtitle: input.subtitle ?? null,
                kind: input.kind ?? 'custom',
            })
            .select('*')
            .single();
        if (error || !data) throw new Error(`createDate: ${error?.message}`);
        return toDomainDate(data as DateRow);
    }
}
