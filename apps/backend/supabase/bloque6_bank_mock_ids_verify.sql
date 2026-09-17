-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN + MIGRACIÓN ROBUSTA de mock_exam_id → text
-- ─────────────────────────────────────────────────────────────────────────────
-- Correr TODO el bloque de una vez en Supabase SQL Editor.
-- El primer SELECT te dice el tipo actual. Si es 'uuid', el DO ejecuta el ALTER.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Diagnóstico: qué tipo tienen las columnas hoy
select
    table_name,
    column_name,
    data_type,
    udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('training_attempts', 'training_mock_progress')
  and column_name = 'mock_exam_id';

-- 2) Migración idempotente y ruidosa. Si el ALTER falla, verás el mensaje.
do $$
begin
    -- training_attempts.mock_exam_id → text
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'training_attempts'
          and column_name = 'mock_exam_id'
          and data_type = 'uuid'
    ) then
        raise notice '[migration] training_attempts.mock_exam_id sigue uuid — migrando a text';
        alter table public.training_attempts
            drop constraint if exists training_attempts_mock_exam_id_fkey;
        alter table public.training_attempts
            alter column mock_exam_id type text using mock_exam_id::text;
        raise notice '[migration] training_attempts.mock_exam_id ahora es text';
    else
        raise notice '[migration] training_attempts.mock_exam_id ya es text (OK)';
    end if;

    -- training_mock_progress.mock_exam_id → text
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'training_mock_progress'
          and column_name = 'mock_exam_id'
          and data_type = 'uuid'
    ) then
        raise notice '[migration] training_mock_progress.mock_exam_id sigue uuid — migrando a text';
        alter table public.training_mock_progress
            drop constraint if exists training_mock_progress_mock_exam_id_fkey;
        alter table public.training_mock_progress
            alter column mock_exam_id type text using mock_exam_id::text;
        raise notice '[migration] training_mock_progress.mock_exam_id ahora es text';
    else
        raise notice '[migration] training_mock_progress.mock_exam_id ya es text (OK)';
    end if;
end $$;

-- 3) Verificación final: repite el SELECT para confirmar
select
    table_name,
    column_name,
    data_type,
    udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('training_attempts', 'training_mock_progress')
  and column_name = 'mock_exam_id';

-- 4) Recrear la vista de patterns con umbral bajo (idempotente)
drop view if exists public.training_error_patterns;
create view public.training_error_patterns as
select
    user_id,
    topic_id,
    topic,
    count(*)                                                    as total_answered,
    sum(is_correct::int)                                        as total_correct,
    count(*) - sum(is_correct::int)                             as total_wrong,
    round(sum(is_correct::int) * 100.0 / count(*))              as domain,
    round((count(*) - sum(is_correct::int)) * 100.0 / count(*)) as fail_rate,
    max(answered_at)                                            as last_attempt_at
from public.training_attempt_responses
where user_id = auth.uid()
group by user_id, topic_id, topic
having count(*) >= 2
order by fail_rate desc;

-- 5) Índice de query por (user_id, mock_exam_id) — recreado como text
drop index if exists idx_training_attempts_user_mock;
create index idx_training_attempts_user_mock
    on public.training_attempts(user_id, mock_exam_id)
    where mock_exam_id is not null;
