import { z } from 'zod';

// BOE-A-AAAA-NNNNN — formato oficial del BOE
const BOE_ID_REGEX = /^BOE-[A-Z]-\d{4}-\d+$/;

export const followRegulationBody = z.object({
    boeIdentifier: z.string().regex(BOE_ID_REGEX, {
        message: 'Usa el formato BOE-A-AAAA-NNNNN',
    }),
    titulo: z.string().min(1).max(300),
});

export const completeMiniTestBody = z.object({
    score: z.number().int().min(0),
    total: z.number().int().min(1),
});

export const syncChangesBody = z.object({
    curso_id: z.string().min(1),
});
