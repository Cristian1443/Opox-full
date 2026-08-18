-- ─────────────────────────────────────────────────────────────────────────────
-- Bloque 12 · Configuración — schema de Supabase
-- ─────────────────────────────────────────────────────────────────────────────
-- Pega este archivo en Supabase Dashboard → SQL Editor → Run.
-- Es idempotente (safe to re-run).
--
-- Tablas:
--   user_preferences  — preferencias de tono IA + accesibilidad (1 fila por usuario)
--   user_feedback     — feedback enviado por los usuarios desde 12.10
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── user_preferences ────────────────────────────────────────────────────────
-- Una sola fila por usuario (UNIQUE en user_id).
-- El backend hace upsert con onConflict='user_id'.
create table if not exists public.user_preferences (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references auth.users(id) on delete cascade,

    -- Tono del tutor IA (pantalla 12.5)
    personality   text not null default 'equilibrado'
                      check (personality in ('cercano', 'equilibrado', 'exigente')),
    detail_level  smallint not null default 1
                      check (detail_level between 0 and 2),
    direct_hints  boolean not null default false,
    motivational  boolean not null default true,

    -- Accesibilidad (pantalla 12.6)
    theme         text not null default 'auto'
                      check (theme in ('auto', 'light', 'dark')),
    font_scale    numeric(4,2) not null default 1.0
                      check (font_scale between 0.5 and 2.5),
    reduce_motion boolean not null default false,

    updated_at    timestamptz not null default now()
);

-- Garantizar unicidad por usuario
create unique index if not exists user_preferences_user_id_uidx
    on public.user_preferences (user_id);

alter table public.user_preferences enable row level security;

drop policy if exists "user_preferences: owner all" on public.user_preferences;
create policy "user_preferences: owner all" on public.user_preferences
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ─── user_feedback ───────────────────────────────────────────────────────────
-- Feedback libre enviado por el usuario desde la pantalla 12.10 "Tu opinión".
-- Solo inserción (el usuario no puede editar ni borrar su feedback pasado).
create table if not exists public.user_feedback (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references auth.users(id) on delete cascade,
    type       text not null check (type in ('suggestion', 'bug', 'other')),
    message    text not null check (char_length(message) between 1 and 500),
    created_at timestamptz not null default now()
);

create index if not exists user_feedback_user_idx
    on public.user_feedback (user_id, created_at desc);

alter table public.user_feedback enable row level security;

-- El usuario solo puede insertar y leer su propio feedback
drop policy if exists "user_feedback: owner insert" on public.user_feedback;
create policy "user_feedback: owner insert" on public.user_feedback
    for insert with check (auth.uid() = user_id);

drop policy if exists "user_feedback: owner select" on public.user_feedback;
create policy "user_feedback: owner select" on public.user_feedback
    for select using (auth.uid() = user_id);
