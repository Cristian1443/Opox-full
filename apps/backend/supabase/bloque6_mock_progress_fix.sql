-- ─────────────────────────────────────────────────────────────────────────────
-- FIX: mock_exam_progress con mock_exam_id text (nombre real de la tabla)
-- ─────────────────────────────────────────────────────────────────────────────
-- La tabla se llama `mock_exam_progress` (definida en dashboard_continue_where_left.sql).
-- Nació con `mock_exam_id uuid` + FK a training_mock_exams, pero ahora los IDs
-- vienen del Motor (hex de 16 chars) → cada PUT /training/mocks/progress falla.
-- Correr entero en Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Diagnóstico previo
select
    table_name,
    column_name,
    data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'mock_exam_progress'
order by ordinal_position;

-- 2) Migración ruidosa: drop FK + alter column → text
do $$
begin
    -- Drop FK si existe
    if exists (
        select 1 from information_schema.table_constraints
        where table_schema = 'public'
          and table_name = 'mock_exam_progress'
          and constraint_type = 'FOREIGN KEY'
          and constraint_name = 'mock_exam_progress_mock_exam_id_fkey'
    ) then
        raise notice '[migration] eliminando FK mock_exam_progress_mock_exam_id_fkey';
        alter table public.mock_exam_progress
            drop constraint mock_exam_progress_mock_exam_id_fkey;
    end if;

    -- Alter type si sigue uuid
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'mock_exam_progress'
          and column_name = 'mock_exam_id'
          and data_type = 'uuid'
    ) then
        raise notice '[migration] mock_exam_progress.mock_exam_id sigue uuid — migrando a text';
        alter table public.mock_exam_progress
            alter column mock_exam_id type text using mock_exam_id::text;
        raise notice '[migration] mock_exam_progress.mock_exam_id ahora es text';
    else
        raise notice '[migration] mock_exam_progress.mock_exam_id ya es text (OK)';
    end if;
end $$;

-- 3) Verificación final
select
    table_name,
    column_name,
    data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'mock_exam_progress'
order by ordinal_position;
