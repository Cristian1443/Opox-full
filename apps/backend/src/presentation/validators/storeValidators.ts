import { z } from 'zod';

export const publishCommunityTestBody = z.object({
    title: z.string().min(5).max(120),
    description: z.string().max(500).optional(),
    category: z.string().max(40).optional(),
    tags: z.array(z.string().max(30)).max(5).optional(),
    price: z.number().int().min(0).optional(),
    questionCount: z.number().int().min(1).max(200).optional(),
});
