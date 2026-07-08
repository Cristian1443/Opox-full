-- ─────────────────────────────────────────────────────────────
-- Bloque 2 · Dashboard — schema de Supabase
-- ─────────────────────────────────────────────────────────────
-- No hay migraciones automatizadas en este repo (ver apps/backend/README.md).
-- Pega este archivo completo en Supabase Dashboard → SQL Editor → Run.
-- Es idempotente: se puede volver a ejecutar sin duplicar nada.
--
-- Las tablas del Bloque 1 (biometric_challenges, biometric_devices) NO
-- están aquí — viven donde el autor original de ese bloque las haya creado.

-- ─── notifications ──────────────────────────────
-- Bandeja de notificaciones (2.3) + nudges flotantes (2.4 a/b/c). Un nudge
-- es una fila con is_nudge = true; nudge_kind indica cuál de los tres es.
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    category text not null check (category in ('boe', 'social', 'general')),
    icon text not null,
    title text not null,
    body text not null,
    is_nudge boolean not null default false,
    nudge_kind text check (nudge_kind in ('fatigue', 'academic', 'boe')),
    primary_label text,
    secondary_label text,
    action_route text,
    read_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists notifications_user_feed_idx
    on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
    on public.notifications (user_id, read_at)
    where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications: owner select" on public.notifications;
create policy "notifications: owner select" on public.notifications
    for select using (auth.uid() = user_id);

drop policy if exists "notifications: owner update" on public.notifications;
create policy "notifications: owner update" on public.notifications
    for update using (auth.uid() = user_id);

-- El backend siempre escribe con la service_role key (bypasea RLS). Estas
-- políticas son defensa en profundidad por si el mobile alguna vez habla
-- directo con Supabase; no hay policy de insert porque hoy solo el backend
-- (service_role) crea notificaciones.

-- ─── user_gamification ──────────────────────────
-- Snapshot de racha diaria + saldo de Opopoints (widget "Racha" del 2.1).
create table if not exists public.user_gamification (
    user_id uuid primary key references auth.users(id) on delete cascade,
    current_streak integer not null default 0,
    longest_streak integer not null default 0,
    opopoints_balance integer not null default 0,
    last_activity_date date,
    updated_at timestamptz not null default now()
);

alter table public.user_gamification enable row level security;

drop policy if exists "user_gamification: owner select" on public.user_gamification;
create policy "user_gamification: owner select" on public.user_gamification
    for select using (auth.uid() = user_id);

-- ─── opopoints_ledger ────────────────────────────
-- Auditoría insert-only de cada movimiento de Opopoints. No se lee desde
-- la API todavía (el balance vivo está en user_gamification.opopoints_balance);
-- existe para poder investigar/depurar saldos más adelante.
create table if not exists public.opopoints_ledger (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    amount integer not null,
    reason text not null,
    created_at timestamptz not null default now()
);

create index if not exists opopoints_ledger_user_idx
    on public.opopoints_ledger (user_id, created_at desc);

alter table public.opopoints_ledger enable row level security;

drop policy if exists "opopoints_ledger: owner select" on public.opopoints_ledger;
create policy "opopoints_ledger: owner select" on public.opopoints_ledger
    for select using (auth.uid() = user_id);
