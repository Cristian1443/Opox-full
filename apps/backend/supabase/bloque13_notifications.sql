-- Bloque 13 · Notificaciones Push
-- Ejecutar en Supabase SQL Editor antes de usar el bloque.

-- Tabla de tokens de dispositivo por usuario.
-- Un usuario puede tener múltiples tokens (varios dispositivos).
-- device_id asegura unicidad por dispositivo, no por token (el token cambia al reinstalar la app).
CREATE TABLE IF NOT EXISTS user_push_tokens (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token       text        NOT NULL,
    platform    text        NOT NULL CHECK (platform IN ('ios', 'android')),
    device_id   text        NOT NULL DEFAULT '',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, device_id)
);

ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

-- El usuario solo puede gestionar sus propios tokens
CREATE POLICY "push_tokens_owner_all" ON user_push_tokens
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Índice para lookups frecuentes (get tokens by userId)
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON user_push_tokens (user_id);
