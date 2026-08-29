-- ============================================================
-- BLOQUE 10 · MONITOR BOE — Patch 1
-- Ejecutar en Supabase SQL Editor (idempotente).
--
-- Cambios:
--   1. boe_watched_regulations.motor_norma_id — guarda el ID de la norma
--      en el Motor BOE para poder hacer unfollow en el Motor sin lookups extra.
-- ============================================================

ALTER TABLE boe_watched_regulations
    ADD COLUMN IF NOT EXISTS motor_norma_id text;

COMMENT ON COLUMN boe_watched_regulations.motor_norma_id
    IS 'ID de la norma en el Motor BOE externo (NormaOut.id). Nullable: null si el Motor no estaba configurado al hacer follow.';
