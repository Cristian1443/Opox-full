import { z } from 'zod';

const categorySchema = z.enum(['boe', 'social', 'general']);

export const listNotificationsQuerySchema = z.object({
    category: categorySchema.optional(),
    cursor: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const createNotificationSchema = z.object({
    category: categorySchema,
    icon: z.string().min(1).max(40),
    title: z.string().min(1).max(120),
    body: z.string().min(1).max(500),
    isNudge: z.boolean().optional(),
    nudgeKind: z.enum(['fatigue', 'academic', 'boe']).optional(),
    primaryLabel: z.string().min(1).max(60).optional(),
    secondaryLabel: z.string().min(1).max(60).optional(),
    actionRoute: z.string().min(1).max(120).optional(),
});

export const registerActivitySchema = z.object({
    reason: z.string().min(1).max(60),
    points: z.coerce.number().int().min(-1000).max(1000),
});
