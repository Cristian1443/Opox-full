import { z } from 'zod';

export const updatePreferencesBody = z.object({
    personality:  z.enum(['cercano', 'equilibrado', 'exigente']).optional(),
    detailLevel:  z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
    directHints:  z.boolean().optional(),
    motivational: z.boolean().optional(),
    theme:        z.enum(['auto', 'light', 'dark']).optional(),
    fontScale:    z.number().min(0.5).max(2.5).optional(),
    reduceMotion: z.boolean().optional(),
}).refine(obj => Object.keys(obj).length > 0, { message: 'Debe enviar al menos un campo.' });

export const exportProStatsBody = z.object({
    period: z.enum(['week', 'month', 'all']).default('month'),
});

export const submitFeedbackBody = z.object({
    type:    z.enum(['suggestion', 'bug', 'other']),
    message: z.string().trim().min(1).max(500),
});
