import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

/**
 * Trata strings vacíos como si la variable no estuviera definida.
 * Necesario porque dotenv devuelve "" para claves declaradas sin valor
 * (ej. `CLIENT_API_BASE_URL=`) y Zod los validaría contra .url() fallando.
 */
const optionalUrl = z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().url().optional(),
);
const optionalString = z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().optional(),
);

/**
 * Validación estricta de variables de entorno al arranque.
 * Si falta cualquiera obligatoria, el proceso muere con un mensaje claro
 * antes de aceptar tráfico.
 */
const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3000),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    CORS_ORIGINS: z.string().default('http://localhost:8081'),

    // Supabase — opcionales para que el server arranque en dev sin config
    SUPABASE_URL: optionalUrl,
    SUPABASE_ANON_KEY: optionalString,
    SUPABASE_SERVICE_ROLE_KEY: optionalString,

    // APIs externas — opcionales por ahora, contratos por definir
    CLIENT_API_BASE_URL: optionalUrl,
    CLIENT_API_KEY: optionalString,
    CLIENT_API_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),

    AI_API_BASE_URL: optionalUrl,
    AI_API_KEY: optionalString,
    AI_API_DEFAULT_MODEL: optionalString,
    AI_API_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),

    REVENUECAT_WEBHOOK_SECRET: optionalString,
    EXPO_ACCESS_TOKEN: optionalString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error(
        '[env] Variables de entorno inválidas:',
        JSON.stringify(parsed.error.format(), null, 2),
    );
    process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);

export const isSupabaseConfigured = Boolean(
    env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY,
);
