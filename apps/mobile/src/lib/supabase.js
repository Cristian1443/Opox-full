import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Solo disponible cuando el .env tiene las dos vars EXPO_PUBLIC_SUPABASE_*.
// Sin ellas, supabase es null y los consumidores deben hacer fallback a polling.
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        realtime: { params: { eventsPerSecond: 10 } },
        auth: { persistSession: false },
    })
    : null;
