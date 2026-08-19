import { z } from 'zod';

export const registerPushTokenBody = z.object({
    token:    z.string().startsWith('ExponentPushToken[', { message: 'Token Expo inválido' }),
    platform: z.enum(['ios', 'android']),
    deviceId: z.string().min(1, { message: 'deviceId es requerido' }),
});
