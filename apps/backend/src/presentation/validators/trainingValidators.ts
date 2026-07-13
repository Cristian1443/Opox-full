import { z } from 'zod';

const difficultySchema = z.enum(['easy', 'medium', 'hard']);
const sourceSchema = z.enum(['generator', 'official', 'surgical']);
const mimeSchema = z.enum(['image/jpeg', 'image/png', 'image/webp']);

export const listMocksQuerySchema = z.object({
    oposicion: z.string().min(1).max(60),
});

export const generateQuestionsSchema = z.object({
    oposicion: z.string().min(1).max(60),
    topicId: z.string().min(1).max(60).optional(),
    difficulty: difficultySchema.optional(),
    count: z.coerce.number().int().min(1).max(100).optional(),
});

export const analyzePhotoSchema = z.object({
    imageBase64: z.string().min(1),
    mimeType: mimeSchema,
    oposicion: z.string().min(1).max(60),
});

export const generateSurgicalSchema = z.object({
    oposicion: z.string().min(1).max(60),
    count: z.coerce.number().int().min(5).max(50).optional(),
});

const responseInputSchema = z.object({
    questionId: z.string().uuid().optional(),
    topicId: z.string().min(1).max(60),
    topic: z.string().min(1).max(120),
    questionText: z.string().min(1),
    optionsSnapshot: z.array(z.string().min(1)).length(4),
    correctIndex: z.number().int().min(0).max(3),
    userAnswerIndex: z.number().int().min(0).max(3).nullable(),
    timeSecs: z.number().int().positive().optional(),
});

export const saveAttemptSchema = z.object({
    source: sourceSchema,
    mockExamId: z.string().uuid().optional(),
    topicId: z.string().min(1).max(60).optional(),
    difficulty: difficultySchema.optional(),
    durationSecs: z.number().int().positive().optional(),
    responses: z.array(responseInputSchema).min(1).max(150),
});

export const saveBookmarkSchema = z.object({
    concept: z.string().min(1).max(200),
    question: z.string().min(1).max(400),
    answer: z.string().min(1).max(800),
    relatedTopicId: z.string().min(1).max(60).optional(),
});
