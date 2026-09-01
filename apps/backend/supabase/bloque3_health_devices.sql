-- Bloque 3 · Salud — dispositivos conectados
-- Correr en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_connected_devices (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name  text NOT NULL,
    platform     text NOT NULL,            -- 'ios_healthkit' | 'health_connect' | custom
    icon         text NOT NULL DEFAULT 'watch-outline',
    connected_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, platform)
);

ALTER TABLE user_connected_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner-all" ON user_connected_devices
    USING (auth.uid() = user_id);
