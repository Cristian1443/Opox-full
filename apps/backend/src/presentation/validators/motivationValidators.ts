import { z } from 'zod';

export const rankingQuerySchema = z.object({
    scope: z.enum(['weekly', 'global', 'oposicion']).default('global'),
    limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const createClanSchema = z.object({
    name: z.string().min(2).max(60).transform((s) => s.trim()),
    initials: z.string().min(1).max(3).transform((s) => s.trim().toUpperCase()),
    description: z.string().max(200).optional(),
});

export const sendClanMessageSchema = z.object({
    body: z.string().min(1).max(500),
});

export const listClanMessagesQuerySchema = z.object({
    after: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const createClanChallengeSchema = z.object({
    title: z.string().min(1).max(120),
    subtitle: z.string().min(1).max(160).optional(),
    questionCount: z.coerce.number().int().min(1).max(500),
    rewardPoints: z.coerce.number().int().min(0).max(5000),
    expiresAt: z.string().datetime().optional(),
});
