import { z } from 'zod';

// ── Formatos aceptados por el backend (espejo de ACCEPTED_MIME del móvil) ──
const ACCEPTED_MIME = [
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf',
] as const;

export const uploadNoteBody = z.object({
    oposicion: z.string().min(1).max(60),
    kind: z.enum(['pdf', 'photo']),
    fileName: z.string().min(1).max(120),
    files: z.array(z.object({
        base64: z.string().min(1),
        mimeType: z.enum(ACCEPTED_MIME),
        sizeBytes: z.number().int().positive(),
    })).min(1).max(30),
});

export const updateTagsBody = z.object({
    tags: z.array(z.string().trim().min(1).max(30)).max(12),
});

export const generateTestBody = z.object({
    questionCount: z.number().int().min(1).max(50),
    topics: z.array(z.string().min(1).max(30)).max(20),
    timed: z.boolean().optional(),
});
