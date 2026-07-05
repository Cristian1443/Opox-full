import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '../../config';
import { logger } from '@opox/utils';

/**
 * Dos clientes Supabase con service_role — SOLO para backend.
 * NUNCA exponer esta key al mobile o a un cliente público.
 *
 * Por qué DOS instancias y no una:
 *   supabase-js v2 sobrescribe el header `Authorization` de la parte REST
 *   con el JWT del usuario en cuanto se llama a `auth.signInWithPassword`,
 *   `signUp`, `verifyOtp`, etc. A partir de ahí, los `.from(...)` de ese
 *   cliente viajan con rol `authenticated` en vez de `service_role`, lo
 *   que rompe cualquier tabla con RLS activo sin política para authenticated.
 *
 *   Aislamos: `supabaseAuth` maneja todos los `.auth.xxx` (puede quedar
 *   contaminado, no importa); `supabaseAdmin` sólo se usa para `.from(...)`
 *   y `.auth.admin.xxx` (nunca se le llama signIn* para que su header
 *   Authorization permanezca fijado a la service_role key).
 *
 * Si las env vars no están configuradas, las implementaciones de repo
 * lanzan un error claro al usarse.
 */
let supabaseAuth: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;

function assertConfigured(): void {
    if (!isSupabaseConfigured) {
        throw new Error(
            '[supabase] Falta configuración. Rellena SUPABASE_URL, SUPABASE_ANON_KEY ' +
            'y SUPABASE_SERVICE_ROLE_KEY en apps/backend/.env',
        );
    }
}

function newClient(): SupabaseClient {
    return createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

/**
 * Cliente para operaciones de autenticación (`signIn*`, `signUp`, `verifyOtp`,
 * `refreshSession`, `getUser`). Su estado de sesión queda "contaminado" tras
 * cada login — no usar para `.from(...)`.
 */
export function getSupabaseAuth(): SupabaseClient {
    assertConfigured();
    if (!supabaseAuth) {
        supabaseAuth = newClient();
        logger.info('[supabase] cliente auth inicializado');
    }
    return supabaseAuth;
}

/**
 * Cliente para operaciones admin sobre tablas (`.from(...)`) y endpoints
 * admin (`.auth.admin.xxx`). Su header Authorization nunca se toca, así
 * mantiene la service_role y bypasea RLS.
 */
export function getSupabaseAdmin(): SupabaseClient {
    assertConfigured();
    if (!supabaseAdmin) {
        supabaseAdmin = newClient();
        logger.info('[supabase] cliente admin inicializado');
    }
    return supabaseAdmin;
}
