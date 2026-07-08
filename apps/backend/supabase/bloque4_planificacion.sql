-- ─────────────────────────────────────────────────────────────
-- Bloque 4 · Planificación — schema de Supabase
-- ─────────────────────────────────────────────────────────────
-- Pega este archivo completo en Supabase Dashboard → SQL Editor → Run.
-- Es idempotente.

-- ─── study_plans ─────────────────────────────────
-- Ajustes del plan (4.6): ritmo, días de estudio, intensidad, fecha de examen
-- (usada para el horizonte macro 4.4). Una fila por usuario.
create table if not exists public.study_plans (
    user_id uuid primary key references auth.users(id) on delete cascade,
    tests_per_day integer not null default 3,
    -- días ISO: 1=lunes .. 7=domingo
    study_days integer[] not null default '{1,2,3,4,5}',
    intensity text not null default 'medium' check (intensity in ('low', 'medium', 'high')),
    exam_date date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.study_plans enable row level security;
drop policy if exists "study_plans: owner all" on public.study_plans;
create policy "study_plans: owner all" on public.study_plans
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── study_tasks ─────────────────────────────────
-- Tareas planificadas por día (4.2 Hoy, 4.3 Semana). Auto-reportadas: no hay
-- todavía motor de tests real (Bloques 6/7) que las marque solas.
create table if not exists public.study_tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    task_date date not null,
    title text not null,
    subtitle text,
    kind text not null default 'other' check (kind in ('test', 'tutor', 'simulacro', 'other')),
    time_of_day text check (time_of_day in ('morning', 'afternoon', 'evening')),
    done boolean not null default false,
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists study_tasks_user_date_idx
    on public.study_tasks (user_id, task_date);

alter table public.study_tasks enable row level security;
drop policy if exists "study_tasks: owner all" on public.study_tasks;
create policy "study_tasks: owner all" on public.study_tasks
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── plan_dates ──────────────────────────────────
-- Agenda del opositor (4.5): plazos de convocatoria, ejercicios, fechas propias.
create table if not exists public.plan_dates (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    event_date date not null,
    title text not null,
    subtitle text,
    kind text not null default 'custom' check (kind in ('exam_deadline', 'exam', 'custom')),
    created_at timestamptz not null default now()
);

create index if not exists plan_dates_user_date_idx
    on public.plan_dates (user_id, event_date);

alter table public.plan_dates enable row level security;
drop policy if exists "plan_dates: owner all" on public.plan_dates;
create policy "plan_dates: owner all" on public.plan_dates
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
