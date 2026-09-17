-- ============================================================
-- TABLA training_courses — Mapeo oposicion → Motor curso_id
-- Infraestructura multi-curso. Ejecutar una vez en Supabase.
-- Es idempotente (safe to re-run).
--
-- Mientras haya un único curso activo, todos los usuarios caen
-- al mismo motor_curso_id vía la columna is_default.
-- Cuando haya N cursos, cada usuario se filtra por oposicion.
-- ============================================================

CREATE TABLE IF NOT EXISTS training_courses (
    oposicion       text PRIMARY KEY,
    motor_curso_id  text NOT NULL,
    label           text NOT NULL,
    is_default      boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- Solo service_role puede escribir; usuarios autenticados pueden leer.
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "training_courses_read_authenticated" ON training_courses;
CREATE POLICY "training_courses_read_authenticated" ON training_courses
    FOR SELECT USING (auth.role() = 'authenticated');

-- ── Seed: único curso activo — Policía de Galicia (temario completo) ─────────
-- 2026-09-15: el equipo IA re-subió los módulos → nuevo course_id ef7d941bea5f41d7
-- (40 temas, 4 bloques, 1784 páginas). El anterior 672e3a8bad0f45c8 quedó huérfano
-- y devuelve `curso_no_encontrado` en cada llamada al Motor. Historial de IDs:
--   0bed919120024e5f (parcial, solo Tema 1, antes de 2026-09-09)
--   672e3a8bad0f45c8 (completo, 2026-09-09 → 2026-09-15)
--   ef7d941bea5f41d7 (completo, desde 2026-09-15) ← ACTIVO
--
-- IMPORTANTE: solo se sirve UNA oposición ('policia-local-galicia'). La fila
-- legacy 'justicia-tramitacion' se retiró 2026-09-17 porque su label no
-- matcheaba ningún curso "listo" del Motor → course-sync no podía refrescar
-- sus training_topics y el Laboratorio de errores no mostraba los temas de
-- exámenes hechos desde el banco. Correr también el SQL:
--   bloque6_dbclean_policia_galicia_only.sql
-- para migrar user_metadata + profiles + cleanup en instalaciones ya usadas.
INSERT INTO training_courses (oposicion, motor_curso_id, label, is_default) VALUES
('policia-local-galicia', 'ef7d941bea5f41d7', 'Policía de Galicia', true)
ON CONFLICT (oposicion) DO UPDATE
    SET motor_curso_id = EXCLUDED.motor_curso_id,
        label          = EXCLUDED.label,
        is_default     = EXCLUDED.is_default;
