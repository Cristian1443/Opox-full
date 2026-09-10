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
-- 2026-09-09: curso completo con los 4 bloques (40 temas, 1784 páginas).
-- Reemplaza el curso previo 0bed919120024e5f (parcial, solo Tema 1) por 672e3a8bad0f45c8.
INSERT INTO training_courses (oposicion, motor_curso_id, label, is_default) VALUES
('policia-local-galicia', '672e3a8bad0f45c8', 'Policía de Galicia', true)
ON CONFLICT (oposicion) DO UPDATE
    SET motor_curso_id = EXCLUDED.motor_curso_id,
        label          = EXCLUDED.label,
        is_default     = EXCLUDED.is_default;

-- Mantener justicia-tramitacion apuntando al mismo curso mientras no haya
-- contenido separado. Eliminar este registro cuando exista un curso propio.
INSERT INTO training_courses (oposicion, motor_curso_id, label, is_default) VALUES
('justicia-tramitacion', '672e3a8bad0f45c8', 'Justicia · Tramitación Procesal', false)
ON CONFLICT (oposicion) DO UPDATE
    SET motor_curso_id = EXCLUDED.motor_curso_id,
        label          = EXCLUDED.label;
