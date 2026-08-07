import { z } from 'zod';

// BOE-A-AAAA-NNNNN — formato oficial del BOE
const BOE_ID_REGEX = /^BOE-[A-Z]-\d{4}-\d+$/;

export const addRegulationBody = z.object({
    boeIdentifier: z.string().regex(BOE_ID_REGEX, {
        message: 'Usa el formato BOE-A-AAAA-NNNNN',
    }),
});

export const completeMiniTestBody = z.object({
    score: z.number().int().min(0),
    total: z.number().int().min(1),
});
