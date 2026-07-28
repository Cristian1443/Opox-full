import { z } from 'zod';

export const createConversationBody = z.object({
    title: z.string().min(1).max(120).default('Nueva conversación'),
    topic: z.string().max(80).nullable().default(null),
});

export const sendMessageBody = z.object({
    content: z.string().min(1).max(4000),
});

export const generateDeckBody = z.object({
    topicId: z.string().min(1).max(80),
    topicTitle: z.string().min(1).max(120),
    oposicion: z.string().min(1).max(80),
});

export const submitReviewBody = z.object({
    knownCount: z.number().int().min(0),
    failedCount: z.number().int().min(0),
    failedCardIds: z.array(z.string().uuid()).default([]),
});

export const saveProgressBody = z.object({
    positionSecs: z.number().int().min(0),
});

export const oposicionQuery = z.object({
    oposicion: z.string().min(1).max(80),
});
