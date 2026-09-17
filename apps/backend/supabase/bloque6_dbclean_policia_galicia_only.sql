-- ─────────────────────────────────────────────────────────────────────────────
-- CLEANUP · Dejar Policía de Galicia como única oposición activa (2026-09-17)
-- ─────────────────────────────────────────────────────────────────────────────
-- Estado detectado:
--   - training_courses tiene 2 filas: 'policia-local-galicia' (label
--     matchea un curso "listo" del Motor) y 'justicia-tramitacion' (label
--     'Justicia · Tramitación Procesal' NO existe en el Motor → course-sync
--     no puede refrescar sus training_topics → los intentos del banco quedan
--     con IDs hex sin resolver → filtrados en el Laboratorio de errores).
--   - Usuarios legacy tienen user_metadata.oposicion='justicia-tramitacion'
--     que sirve las mismas preguntas (el mapping apunta al mismo motor_curso_id)
--     pero rompe el enrichment de topics.
--
-- Este SQL:
--   1. Migra a TODOS los usuarios a 'policia-local-galicia' (auth.users +
--      public.profiles + training_attempt_responses y demás datos históricos).
--   2. Elimina la fila 'justicia-tramitacion' de training_courses.
--   3. Elimina los training_topics obsoletos de 'justicia-tramitacion'.
--   4. Dispara el course-sync manualmente al final: si el backend está corriendo
--      y detecta que faltan topics para 'policia-local-galicia', los baja del
--      Motor. Si no, corre de todos modos en el próximo tick del cron (30 min).
--
-- Es idempotente. Correr en Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Diagnóstico previo
select 'training_courses ANTES' as tag, oposicion, motor_curso_id, label
    from public.training_courses
    order by oposicion;

select 'usuarios con justicia-tramitacion' as tag,
    count(*)                                                   as en_auth_users,
    count(*) filter (where raw_user_meta_data->>'oposicion' is not null) as con_metadata
    from auth.users
    where raw_user_meta_data->>'oposicion' = 'justicia-tramitacion';

-- 2) Migrar user_metadata (auth.users) — TODOS los usuarios que estén en
--    'justicia-tramitacion' pasan a 'policia-local-galicia'.
update auth.users
    set raw_user_meta_data = jsonb_set(
            coalesce(raw_user_meta_data, '{}'::jsonb),
            '{oposicion}',
            to_jsonb('policia-local-galicia'::text)
        ),
        updated_at = now()
    where raw_user_meta_data->>'oposicion' = 'justicia-tramitacion';

-- 3) Migrar public.profiles (espejo del metadata, si existe)
update public.profiles
    set oposicion = 'policia-local-galicia'
    where oposicion = 'justicia-tramitacion';

-- 4) Eliminar la fila obsoleta de training_courses
delete from public.training_courses
    where oposicion = 'justicia-tramitacion';

-- 5) Eliminar los training_topics viejos de justicia-tramitacion
--    (los slugs legacy tipo 'constitucion', 'ley-39' que no vienen del Motor)
delete from public.training_topics
    where oposicion = 'justicia-tramitacion';

-- 6) Verificación final
select 'training_courses DESPUÉS' as tag, oposicion, motor_curso_id, label
    from public.training_courses
    order by oposicion;

select 'auth.users por oposicion' as tag,
    coalesce(raw_user_meta_data->>'oposicion', '(sin oposicion)') as oposicion,
    count(*)
    from auth.users
    group by coalesce(raw_user_meta_data->>'oposicion', '(sin oposicion)')
    order by 2 desc;

select 'training_topics por oposicion' as tag, oposicion, count(*) as n_temas
    from public.training_topics
    group by oposicion
    order by oposicion;
