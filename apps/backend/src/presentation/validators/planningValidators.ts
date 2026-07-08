import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha en formato YYYY-MM-DD.');
const taskKindSchema = z.enum(['test', 'tutor', 'simulacro', 'other']);
const timeOfDaySchema = z.enum(['morning', 'afternoon', 'evening']);

export const updatePlanSchema = z.object({
    testsPerDay: z.coerce.number().int().min(1).max(20).optional(),
    studyDays: z.array(z.number().int().min(1).max(7)).min(0).max(7).optional(),
    intensity: z.enum(['low', 'medium', 'high']).optional(),
    examDate: dateSchema.nullable().optional(),
});

export const listTasksQuerySchema = z.object({
    date: dateSchema.optional(),
});

export const createTaskSchema = z.object({
    taskDate: dateSchema,
    title: z.string().min(1).max(120),
    subtitle: z.string().min(1).max(160).optional(),
    kind: taskKindSchema.optional(),
    timeOfDay: timeOfDaySchema.optional(),
});

export const toggleTaskSchema = z.object({
    done: z.boolean(),
});

export const weekQuerySchema = z.object({
    weekStart: dateSchema.optional(),
    selectedDate: dateSchema.optional(),
});

export const createAgendaDateSchema = z.object({
    eventDate: dateSchema,
    title: z.string().min(1).max(120),
    subtitle: z.string().min(1).max(160).optional(),
    kind: z.enum(['exam_deadline', 'exam', 'custom']).optional(),
});
