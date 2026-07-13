-- ─────────────────────────────────────────────────────────────────────────────
-- Bloque 6 · Entrenamiento — schema de Supabase
-- ─────────────────────────────────────────────────────────────────────────────
-- Pega este archivo completo en Supabase Dashboard → SQL Editor → Run.
-- Es idempotente (safe to re-run).
-- No tiene dependencias de otros bloques, pero se recomienda correr
-- bloque2_dashboard.sql antes si quieres que los intentos completados
-- puedan sumar racha/Opopoints en el futuro.
--
-- Tablas:
--   training_mock_exams        — catálogo de simulacros oficiales (datos fijos)
--   training_questions         — banco de preguntas de simulacros oficiales
--   training_attempts          — cada sesión de test completada por un usuario
--   training_attempt_responses — respuesta del usuario a cada pregunta del intento
--   training_bookmarks         — flashcards guardadas desde el Foto-Test (6.5)
--
-- Vista:
--   training_error_patterns    — patrones de error calculados desde responses (sin IA)
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── training_mock_exams ─────────────────────────────────────────────────────
-- Catálogo de exámenes oficiales de años anteriores, por oposición.
-- Solo el service role escribe aquí (carga inicial de datos).
-- Los usuarios solo leen.
create table if not exists public.training_mock_exams (
    id              uuid primary key default gen_random_uuid(),
    -- Código de la oposición (ej. 'justicia-tramitacion', 'policia-nacional')
    oposicion       text not null,
    year            integer not null,
    title           text not null,
    -- Categoría legible (ej. 'Justicia · Tramitación Procesal')
    category        text,
    question_count  integer not null,
    duration_minutes integer not null,
    -- Penalización por respuesta incorrecta (ej. 0.33 = un tercio)
    -- NULL significa sin penalización
    penalty_ratio   numeric(4,2),
    created_at      timestamptz not null default now()
);
    
-- Un único simulacro por oposición y año
create unique index if not exists training_mock_exams_oposicion_year_uidx
    on public.training_mock_exams (oposicion, year);

alter table public.training_mock_exams enable row level security;
drop policy if exists "mock_exams: read authenticated" on public.training_mock_exams;
create policy "mock_exams: read authenticated" on public.training_mock_exams
    for select using (auth.role() = 'authenticated');


-- ─── training_questions ──────────────────────────────────────────────────────
-- Banco de preguntas de simulacros oficiales.
-- Las preguntas generadas por la IA NO se guardan aquí — se generan al
-- vuelo por el use case y se snapshot en training_attempt_responses.
create table if not exists public.training_questions (
    id              uuid primary key default gen_random_uuid(),
    -- NULL para preguntas standalone (no vinculadas a un simulacro)
    mock_exam_id    uuid references public.training_mock_exams(id) on delete set null,
    oposicion       text not null,
    -- Identificador del tema (ej. 'ley-39', 'constitucion')
    topic_id        text not null,
    -- Nombre legible del tema (snapshot para no perderlo si cambia topic_id)
    topic           text not null,
    text            text not null,
    -- Array JSON de exactamente 4 strings: ["opción A", "opción B", "opción C", "opción D"]
    options         jsonb not null,
    -- Índice de la opción correcta (0 = A, 1 = B, 2 = C, 3 = D)
    correct_index   smallint not null check (correct_index between 0 and 3),
    explanation     text,
    difficulty      text not null default 'medium'
                        check (difficulty in ('easy', 'medium', 'hard')),
    -- 'official' = pregunta de examen real; 'ai_generated' = generada y cacheada
    source          text not null default 'official'
                        check (source in ('official', 'ai_generated')),
    created_at      timestamptz not null default now()
);

create index if not exists training_questions_mock_exam_idx
    on public.training_questions (mock_exam_id);
create index if not exists training_questions_oposicion_topic_idx
    on public.training_questions (oposicion, topic_id);

alter table public.training_questions enable row level security;
drop policy if exists "training_questions: read authenticated" on public.training_questions;
create policy "training_questions: read authenticated" on public.training_questions
    for select using (auth.role() = 'authenticated');


-- ─── training_attempts ───────────────────────────────────────────────────────
-- Una fila por sesión de test completada. Los intentos incompletos (el usuario
-- cierra la app a mitad) no se guardan — solo se persiste al finalizar.
create table if not exists public.training_attempts (
    id              uuid primary key default gen_random_uuid(),
    user_id         uuid not null references auth.users(id) on delete cascade,
    -- Modo de entrenamiento que originó el intento
    source          text not null
                        check (source in ('generator', 'official', 'surgical')),
    -- Relleno solo cuando source = 'official'
    mock_exam_id    uuid references public.training_mock_exams(id) on delete set null,
    -- Relleno para 'generator' y 'surgical' (puede ser 'all' para todo el temario)
    topic_id        text,
    difficulty      text check (difficulty in ('easy', 'medium', 'hard')),
    -- Parámetros del intento (para regenerar o mostrar en historial)
    question_count  integer not null,
    correct_count   integer not null default 0,
    wrong_count     integer not null default 0,
    blank_count     integer not null default 0,
    -- Nota final en la escala 0–10 (calculada por el backend según penalty_ratio)
    score           numeric(4,2),
    duration_secs   integer,
    -- Cuándo se completó (distinto de created_at: un simulacro puede durar horas)
    completed_at    timestamptz not null default now(),
    created_at      timestamptz not null default now()
);

create index if not exists training_attempts_user_idx
    on public.training_attempts (user_id, completed_at desc);
create index if not exists training_attempts_user_source_idx
    on public.training_attempts (user_id, source);

alter table public.training_attempts enable row level security;
drop policy if exists "training_attempts: owner all" on public.training_attempts;
create policy "training_attempts: owner all" on public.training_attempts
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ─── training_attempt_responses ──────────────────────────────────────────────
-- Una fila por pregunta respondida dentro de un intento. Incluye snapshot del
-- texto y opciones para que el historial no se rompa si la pregunta cambia.
-- user_id duplicado de attempts para simplificar el RLS sin joins.
create table if not exists public.training_attempt_responses (
    id                  uuid primary key default gen_random_uuid(),
    attempt_id          uuid not null
                            references public.training_attempts(id) on delete cascade,
    user_id             uuid not null references auth.users(id) on delete cascade,
    -- NULL si la pregunta fue generada por IA (no persistida en training_questions)
    question_id         uuid references public.training_questions(id) on delete set null,
    -- Tema al que pertenece la pregunta (necesario para calcular error_patterns)
    topic_id            text not null,
    topic               text not null,
    -- Snapshot del contenido de la pregunta en el momento del intento
    question_text       text not null,
    options_snapshot    jsonb not null,
    correct_index       smallint not null,
    -- NULL si el usuario dejó la pregunta en blanco
    user_answer_index   smallint check (user_answer_index between 0 and 3),
    is_correct          boolean not null,
    -- Segundos que tardó en responder esta pregunta (solo en modo contrarreloj)
    time_secs           integer,
    answered_at         timestamptz not null default now()
);

create index if not exists training_attempt_responses_attempt_idx
    on public.training_attempt_responses (attempt_id);
create index if not exists training_attempt_responses_user_topic_idx
    on public.training_attempt_responses (user_id, topic_id);

alter table public.training_attempt_responses enable row level security;
drop policy if exists "training_responses: owner all" on public.training_attempt_responses;
create policy "training_responses: owner all" on public.training_attempt_responses
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ─── training_bookmarks ──────────────────────────────────────────────────────
-- Flashcards guardadas por el usuario desde el Foto-Test (pantalla 6.5).
-- El contenido es el que devuelve la IA (o el stub): concepto, pregunta, respuesta.
create table if not exists public.training_bookmarks (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users(id) on delete cascade,
    -- Concepto identificado por la IA en la foto
    concept             text not null,
    question            text not null,
    answer              text not null,
    -- topic_id sugerido por la IA (puede ser null si no lo identificó)
    related_topic_id    text,
    created_at          timestamptz not null default now()
);

create index if not exists training_bookmarks_user_idx
    on public.training_bookmarks (user_id, created_at desc);

alter table public.training_bookmarks enable row level security;
drop policy if exists "training_bookmarks: owner all" on public.training_bookmarks;
create policy "training_bookmarks: owner all" on public.training_bookmarks
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ─── Vista: training_error_patterns ──────────────────────────────────────────
-- Calcula los patrones de error del usuario directamente desde sus respuestas,
-- SIN necesitar IA. El Laboratorio de Errores (pantalla 6.8) consume esta vista.
--
-- Las vistas en Supabase corren como el owner y evitan el RLS por defecto.
-- El filtro WHERE user_id = auth.uid() garantiza que cada usuario solo ve
-- sus propios patrones sin depender de security_invoker (requeriría PG15+).
drop view if exists public.training_error_patterns;
create view public.training_error_patterns as
select
    user_id,
    topic_id,
    topic,
    count(*)                                                     as total_answered,
    sum(is_correct::int)                                         as total_correct,
    count(*) - sum(is_correct::int)                              as total_wrong,
    -- Porcentaje de dominio (0–100): cuántas ha acertado
    round(sum(is_correct::int) * 100.0 / count(*))              as domain,
    -- Tasa de fallo (0–100): cuántas ha fallado
    round((count(*) - sum(is_correct::int)) * 100.0 / count(*)) as fail_rate
from
    public.training_attempt_responses
where
    -- Filtro de seguridad: cada usuario solo ve sus propios patrones
    user_id = auth.uid()
group by
    user_id, topic_id, topic
-- Solo muestra temas con al menos 5 respuestas (mínimo estadístico)
having
    count(*) >= 5
order by
    fail_rate desc;


-- ─── Datos iniciales: simulacros Justicia · Tramitación ──────────────────────
-- Carga de ejemplo para el modo "Simulacros oficiales" (pantalla 6.6).
-- Los IDs son fijos (on conflict do nothing) para que no se dupliquen
-- si se corre el script varias veces.
insert into public.training_mock_exams
    (id, oposicion, year, title, category, question_count, duration_minutes, penalty_ratio)
values
    (
        '00000000-0000-0000-0006-202300000001',
        'justicia-tramitacion', 2023,
        'Examen oficial 2023', 'Justicia · Tramitación Procesal',
        100, 90, 0.33
    ),
    (
        '00000000-0000-0000-0006-202200000001',
        'justicia-tramitacion', 2022,
        'Examen oficial 2022', 'Justicia · Tramitación Procesal',
        100, 90, 0.33
    ),
    (
        '00000000-0000-0000-0006-202100000001',
        'justicia-tramitacion', 2021,
        'Examen oficial 2021', 'Justicia · Tramitación Procesal',
        100, 90, 0.33
    ),
    (
        '00000000-0000-0000-0006-201900000001',
        'justicia-tramitacion', 2019,
        'Examen oficial 2019', 'Justicia · Tramitación Procesal',
        100, 90, 0.33
    )
on conflict (oposicion, year) do nothing;
