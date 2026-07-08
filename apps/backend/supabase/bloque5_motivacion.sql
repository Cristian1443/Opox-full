-- ─────────────────────────────────────────────────────────────
-- Bloque 5 · Motivación y Gamificación — schema de Supabase
-- ─────────────────────────────────────────────────────────────
-- Pega este archivo completo en Supabase Dashboard → SQL Editor → Run.
-- Requiere haber corrido antes bloque2_dashboard.sql (usa user_gamification
-- y opopoints_ledger de ahí para racha/puntos). Es idempotente.

-- ─── profiles ────────────────────────────────────
-- Espejo consultable de auth.users.raw_user_meta_data. Necesario porque
-- PostgREST no expone el schema `auth` para joins (rankings y listas de
-- miembros de clan necesitan nombre + puntos en una sola query). Se
-- mantiene sincronizado desde el backend en registro y en updateProfile.
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    oposicion text,
    especialidad text,
    avatar_url text,
    -- Autorreportado. Alimenta el Muro de la Gloria (5.4, Fase 2).
    passed_exam_at timestamptz,
    updated_at timestamptz not null default now()
);

-- Backfill de usuarios ya existentes (antes de que este bloque existiera).
insert into public.profiles (id, display_name, oposicion, especialidad, avatar_url, updated_at)
select
    u.id,
    u.raw_user_meta_data ->> 'display_name',
    u.raw_user_meta_data ->> 'oposicion',
    u.raw_user_meta_data ->> 'especialidad',
    u.raw_user_meta_data ->> 'avatar_url',
    now()
from auth.users u
on conflict (id) do nothing;

alter table public.profiles enable row level security;
-- Directorio público de lectura: rankings y clanes necesitan ver nombres
-- de otros usuarios, no solo el propio.
drop policy if exists "profiles: read all" on public.profiles;
create policy "profiles: read all" on public.profiles for select using (true);
drop policy if exists "profiles: owner update" on public.profiles;
create policy "profiles: owner update" on public.profiles
    for update using (auth.uid() = id) with check (auth.uid() = id);

-- ─── clans ───────────────────────────────────────
-- created_by es nullable con ON DELETE SET NULL: si quien creó el clan
-- borra su cuenta, el clan sigue existiendo para el resto de miembros en
-- vez de bloquear el borrado de la cuenta (comportamiento por defecto de
-- Postgres sin ON DELETE explícito).
create table if not exists public.clans (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    initials text not null,
    description text,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now()
);

-- Migra instalaciones que ya corrieron este archivo antes de este cambio.
alter table public.clans alter column created_by drop not null;
alter table public.clans drop constraint if exists clans_created_by_fkey;
alter table public.clans add constraint clans_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete set null;

alter table public.clans enable row level security;
drop policy if exists "clans: read all" on public.clans;
create policy "clans: read all" on public.clans for select using (true);

-- ─── clan_members ────────────────────────────────
-- Un usuario solo puede estar en un clan a la vez (índice único en user_id).
create table if not exists public.clan_members (
    clan_id uuid not null references public.clans(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null default 'member' check (role in ('leader', 'member')),
    joined_at timestamptz not null default now(),
    primary key (clan_id, user_id)
);

create unique index if not exists clan_members_one_per_user
    on public.clan_members (user_id);

alter table public.clan_members enable row level security;
drop policy if exists "clan_members: read all" on public.clan_members;
create policy "clan_members: read all" on public.clan_members for select using (true);

-- ─── clan_messages ───────────────────────────────
-- Chat de clan (5.7). El mobile hace polling (no realtime en el MVP).
create table if not exists public.clan_messages (
    id uuid primary key default gen_random_uuid(),
    clan_id uuid not null references public.clans(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    body text not null,
    created_at timestamptz not null default now()
);

create index if not exists clan_messages_clan_created_idx
    on public.clan_messages (clan_id, created_at);

alter table public.clan_messages enable row level security;
drop policy if exists "clan_messages: members read" on public.clan_messages;
create policy "clan_messages: members read" on public.clan_messages
    for select using (
        exists (
            select 1 from public.clan_members m
            where m.clan_id = clan_messages.clan_id and m.user_id = auth.uid()
        )
    );

-- ─── clan_challenges + clan_challenge_progress ───
-- Retos del clan (5.8). "Completar" es autorreportado (no hay motor de
-- tests real todavía) y otorga reward_points vía el mismo sistema de
-- Opopoints del Bloque 2 (registerActivity).
create table if not exists public.clan_challenges (
    id uuid primary key default gen_random_uuid(),
    clan_id uuid not null references public.clans(id) on delete cascade,
    created_by uuid references auth.users(id) on delete set null,
    title text not null,
    subtitle text,
    question_count integer not null default 0,
    reward_points integer not null default 0,
    expires_at timestamptz,
    created_at timestamptz not null default now()
);

-- Migra instalaciones que ya corrieron este archivo antes de este cambio.
alter table public.clan_challenges alter column created_by drop not null;
alter table public.clan_challenges drop constraint if exists clan_challenges_created_by_fkey;
alter table public.clan_challenges add constraint clan_challenges_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete set null;

create index if not exists clan_challenges_clan_idx
    on public.clan_challenges (clan_id, created_at desc);

alter table public.clan_challenges enable row level security;
drop policy if exists "clan_challenges: members read" on public.clan_challenges;
create policy "clan_challenges: members read" on public.clan_challenges
    for select using (
        exists (
            select 1 from public.clan_members m
            where m.clan_id = clan_challenges.clan_id and m.user_id = auth.uid()
        )
    );

create table if not exists public.clan_challenge_progress (
    challenge_id uuid not null references public.clan_challenges(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    completed_at timestamptz not null default now(),
    primary key (challenge_id, user_id)
);

alter table public.clan_challenge_progress enable row level security;
drop policy if exists "clan_challenge_progress: read all" on public.clan_challenge_progress;
create policy "clan_challenge_progress: read all" on public.clan_challenge_progress
    for select using (true);

-- ─── Vistas de ranking ───────────────────────────
-- PostgREST no hace JOIN/GROUP BY arbitrario desde el cliente; estas vistas
-- dejan los rankings como un simple SELECT ... ORDER BY ... LIMIT.
-- Se consultan siempre con la service_role key (bypasea RLS igual que las
-- tablas), así que no necesitan políticas propias.

create or replace view public.ranking_global as
select
    g.user_id,
    g.opopoints_balance as points,
    p.display_name,
    p.oposicion,
    p.avatar_url
from public.user_gamification g
join public.profiles p on p.id = g.user_id;

create or replace view public.ranking_weekly as
select
    l.user_id,
    sum(l.amount) as points,
    p.display_name,
    p.oposicion,
    p.avatar_url
from public.opopoints_ledger l
join public.profiles p on p.id = l.user_id
where l.created_at >= date_trunc('week', now())
group by l.user_id, p.display_name, p.oposicion, p.avatar_url;

create or replace view public.clan_points as
select
    cm.clan_id,
    coalesce(sum(g.opopoints_balance), 0) as points
from public.clan_members cm
join public.user_gamification g on g.user_id = cm.user_id
group by cm.clan_id;
