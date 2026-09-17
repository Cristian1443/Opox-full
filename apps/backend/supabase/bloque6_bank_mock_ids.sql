-- ─────────────────────────────────────────────────────────────────────────────
-- Bloque 6.6 · Migración de IDs del banco de exámenes (Motor IA)
-- ─────────────────────────────────────────────────────────────────────────────
-- Contexto: el schema original de bloque6_entrenamiento.sql modelaba
-- mock_exam_id como uuid con FK a training_mock_exams (tabla Supabase).
-- Con el Bloque 6.6 (banco de exámenes del Motor) los IDs son hex de 16 chars
-- generados por el Motor (ej. "fcb72d3a9ecb4338"), NO UUIDs.
--
-- Sin este ALTER:
--   • training_attempts NO se puede insertar con un mock_exam_id del Motor
--     (falla la coerción de text→uuid).
--   • El validador Zod del backend rechaza el body del cliente (mockExamId
--     debe ser UUID).
--
-- Efecto: los intentos del banco no se guardaban → progreso 0% en la lista,
-- Laboratorio de errores sin datos del examen, y cero Opopoints.
--
-- Correr en Supabase SQL Editor ANTES del próximo despliegue.
-- ─────────────────────────────────────────────────────────────────────────────

-- training_attempts: drop FK + text
alter table public.training_attempts
    drop constraint if exists training_attempts_mock_exam_id_fkey;

alter table public.training_attempts
    alter column mock_exam_id type text using mock_exam_id::text;

-- training_mock_progress: drop FK + text (mismo problema)
alter table public.training_mock_progress
    drop constraint if exists training_mock_progress_mock_exam_id_fkey;

alter table public.training_mock_progress
    alter column mock_exam_id type text using mock_exam_id::text;

-- ─── Vista training_error_patterns: bajar umbral ────────────────────────────
-- Antes exigía ≥5 respuestas por tema para aparecer en el Laboratorio. Con los
-- simulacros del banco (93+ preguntas repartidas en 30+ temas) cada tema
-- individual tiene ~3 respuestas → nada aparecía. Bajamos a ≥2 para que un
-- simulacro completo repoble el laboratorio con los temas del examen.
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

-- Índices adicionales para queries por mock_exam_id ahora que es text.
drop index if exists idx_training_attempts_user_mock;
create index idx_training_attempts_user_mock
    on public.training_attempts(user_id, mock_exam_id)
    where mock_exam_id is not null;
