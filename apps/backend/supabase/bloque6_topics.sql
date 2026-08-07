-- ============================================================
-- BLOQUE 6 · TEMAS DEL TEMARIO (training_topics)
-- Ejecutar antes que bloque10_boe.sql.
-- Es idempotente (safe to re-run).
--
-- Esta tabla sirve a dos bloques:
--   - Bloque 6  → Generador Infinito: picker de tema en GeneratorConfigScreen
--   - Bloque 10 → Monitor BOE: pestaña "Mi temario" para filtrar cambios por ley
--
-- El endpoint GET /training/topics?oposicion= la consume en ambos casos.
-- ============================================================

CREATE TABLE IF NOT EXISTS training_topics (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Código de la oposición (ej. 'justicia-tramitacion')
    oposicion   text NOT NULL,
    -- ID de tema que la IA usa como topicId (ej. 'ley-39')
    topic_id    text NOT NULL,
    -- Nombre legible para mostrar en la UI (ej. "Ley 39/2015 · Procedimiento Administrativo")
    label       text NOT NULL,
    -- Orden de aparición en el picker (1 = primero)
    sort_order  integer NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(oposicion, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_training_topics_oposicion
    ON training_topics(oposicion, sort_order ASC);

ALTER TABLE training_topics ENABLE ROW LEVEL SECURITY;
-- Los temas son datos de catálogo: cualquier usuario autenticado puede leerlos.
-- Solo service_role puede escribir (carga inicial).
DROP POLICY IF EXISTS "training_topics_read_authenticated" ON training_topics;
CREATE POLICY "training_topics_read_authenticated" ON training_topics
    FOR SELECT USING (auth.role() = 'authenticated');


-- ── Seed: temas de "Justicia · Tramitación Procesal" ─────────────────────────
-- Coincide con los topicId que usa AiApiClient para generar preguntas.
-- Mantener sincronizado con topicIdToLabel() en AiApiClient.ts.

INSERT INTO training_topics (oposicion, topic_id, label, sort_order) VALUES
('justicia-tramitacion', 'constitucion',                 'Constitución Española 1978',                              1),
('justicia-tramitacion', 'ley-39',                       'Ley 39/2015 · Procedimiento Administrativo Común',        2),
('justicia-tramitacion', 'ley-40',                       'Ley 40/2015 · Régimen Jurídico del Sector Público',       3),
('justicia-tramitacion', 'ebep',                         'RD Leg. 5/2015 · Estatuto del Empleado Público (EBEP)',   4),
('justicia-tramitacion', 'ley-7-1985',                   'Ley 7/1985 · Bases del Régimen Local',                   5),
('justicia-tramitacion', 'lopd',                         'LO 3/2018 · Protección de Datos (LOPD-GDD)',              6),
('justicia-tramitacion', 'ley-9-2017',                   'Ley 9/2017 · Contratos del Sector Público',               7),
('justicia-tramitacion', 'organica-poder-judicial',      'LO 6/1985 · Poder Judicial (LOPJ)',                       8),
('justicia-tramitacion', 'enjuiciamiento-civil',         'Ley 1/2000 · Enjuiciamiento Civil (LEC)',                 9),
('justicia-tramitacion', 'enjuiciamiento-criminal',      'RD 14/09/1882 · Enjuiciamiento Criminal (LECrim)',       10)
ON CONFLICT (oposicion, topic_id) DO UPDATE
    SET label = EXCLUDED.label,
        sort_order = EXCLUDED.sort_order;
