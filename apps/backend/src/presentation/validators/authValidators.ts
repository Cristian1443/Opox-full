import { z } from 'zod';

const emailSchema = z.string().email('Email inválido.').max(255).transform((s) => s.trim().toLowerCase());
const passwordSchema = z.string().min(8, 'Mínimo 8 caracteres.').max(128);

export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    displayName: z.string().min(1, 'Introduce tu nombre.').max(80).transform((s) => s.trim()),
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Introduce tu contraseña.'),
});

export const oauthLoginSchema = z.object({
    provider: z.enum(['google', 'apple', 'meta']),
    idToken: z.string().min(1),
});

export const otpSendSchema = z.object({
    email: emailSchema,
    purpose: z.enum(['email_verification', 'passwordless_login']),
});

export const otpVerifySchema = z.object({
    email: emailSchema,
    // Supabase puede estar configurado con 6 u 8 dígitos según el proyecto
    code: z.string().regex(/^\d{6,8}$/, 'Código de 6 a 8 dígitos.'),
    purpose: z.enum(['email_verification', 'passwordless_login']),
});

export const passwordResetRequestSchema = z.object({
    email: emailSchema,
});

export const passwordResetConfirmSchema = z.object({
    resetToken: z.string().min(1),
    newPassword: passwordSchema,
});

export const biometricChallengeSchema = z.object({
    deviceId: z.string().min(1),
});

export const biometricLinkSchema = z.object({
    devicePublicKey: z.string().min(1),
    deviceId: z.string().min(1),
});

export const biometricLoginSchema = z.object({
    deviceId: z.string().min(1),
    challengeId: z.string().min(1),
    signedChallenge: z.string().min(1),
});

export const acceptTermsSchema = z.object({
    termsVersion: z.string().min(1),
    privacyVersion: z.string().min(1),
});

export const refreshSchema = z.object({
    refreshToken: z.string().min(1),
});
