-- ============================================================
-- BLOQUE 10 · MONITOR BOE — Patch 2
-- Ejecutar en Supabase SQL Editor (idempotente).
--
-- Cambios:
--   1. boe_changes.resumen — guarda el resumen generado por el Motor BOE,
--      más limpio que truncar el texto de los fragmentos.
-- ============================================================

ALTER TABLE boe_changes
    ADD COLUMN IF NOT EXISTS resumen text;

COMMENT ON COLUMN boe_changes.resumen
    IS 'Resumen generado por el Motor BOE (CambioOut.resumen). Nullable: null para cambios sincronizados antes de este patch.';
