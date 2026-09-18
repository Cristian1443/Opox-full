-- Bloque 3 · Salud — Check-in diario
-- Correr en Supabase SQL Editor. Idempotente.
--
-- Este check-in es la fuente primaria de señales del bloque Salud cuando el
-- usuario no tiene un wearable escribiendo a Health Connect / HealthKit.
-- El motor de fatiga usa moodScore + sleepHours + energyLevel + factors como
-- entrada; si además hay wearable, HR/HRV enriquecen la predicción.
--
-- UNIQUE(user_id, local_date) → un check-in por usuario por día (upsert).

CREATE TABLE IF NOT EXISTS user_daily_checkins (
    id            uuid       PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid       NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    local_date    date       NOT NULL,
    mood_score    smallint   NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
    sleep_hours   numeric(3,1) NOT NULL CHECK (sleep_hours BETWEEN 0 AND 24),
    energy_level  text       NOT NULL CHECK (energy_level IN ('low','medium','high')),
    factors       text[]     NOT NULL DEFAULT '{}',
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, local_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_checkins_user_date
    ON user_daily_checkins (user_id, local_date DESC);

ALTER TABLE user_daily_checkins ENABLE ROW LEVEL SECURITY;

-- Idempotente: DROP + CREATE evita error 42710 al re-ejecutar.
DROP POLICY IF EXISTS "owner-all" ON user_daily_checkins;
CREATE POLICY "owner-all" ON user_daily_checkins
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger para mantener updated_at al día en upserts.
CREATE OR REPLACE FUNCTION touch_user_daily_checkins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_user_daily_checkins ON user_daily_checkins;
CREATE TRIGGER trg_touch_user_daily_checkins
    BEFORE UPDATE ON user_daily_checkins
    FOR EACH ROW EXECUTE FUNCTION touch_user_daily_checkins_updated_at();
