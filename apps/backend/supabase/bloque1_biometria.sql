-- Bloque 1 · Auth — tablas de biometría (Ed25519 challenge-response)
-- Ejecutar en Supabase SQL Editor si no existen las tablas.

-- biometric_challenges: retos de un solo uso con TTL corto (~60 s).
CREATE TABLE IF NOT EXISTS biometric_challenges (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id   TEXT        NOT NULL,
    challenge   TEXT        NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- biometric_devices: clave pública Ed25519 por dispositivo.
CREATE TABLE IF NOT EXISTS biometric_devices (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id    TEXT        NOT NULL UNIQUE,
    public_key   TEXT        NOT NULL,
    last_used_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS biometric_challenges_device_idx ON biometric_challenges(device_id);
CREATE INDEX IF NOT EXISTS biometric_devices_user_idx ON biometric_devices(user_id);

-- RLS habilitado: solo el service_role del backend puede leer/escribir
ALTER TABLE biometric_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_devices ENABLE ROW LEVEL SECURITY;

-- challenges: gestionados exclusivamente por el service_role (nunca acceso directo del cliente)
CREATE POLICY "service_role_full_challenges" ON biometric_challenges
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- devices: los usuarios autenticados ven solo sus propios dispositivos
CREATE POLICY "owner_read_devices" ON biometric_devices
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "service_role_full_devices" ON biometric_devices
    FOR ALL TO service_role USING (true) WITH CHECK (true);
