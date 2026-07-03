import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '../../config';
import { logger } from '@opox/utils';

/**
 * Cliente Supabase con service_role — SOLO para backend.
 * NUNCA exponer esta key al mobile o a un cliente público.
 *
 * Si las env vars no están configuradas devolvemos `null` y las
 * implementaciones de repositorio lanzan un error claro al usarse.
 */
let supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
    if (!isSupabaseConfigured) {
        throw new Error(
            '[supabase] Falta configuración. Rellena SUPABASE_URL, SUPABASE_ANON_KEY ' +
            'y SUPABASE_SERVICE_ROLE_KEY en apps/backend/.env',
        );
    }

    if (!supabaseAdmin) {
        supabaseAdmin = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        logger.info('[supabase] cliente admin inicializado');
    }

    return supabaseAdmin;
}
