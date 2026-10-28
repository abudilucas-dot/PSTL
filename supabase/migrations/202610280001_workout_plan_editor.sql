create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text not null default '',
  muscle_group text not null default '',
  media_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_name_owner_unique unique nulls not distinct (owner_id, name)
);

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 100),
  description text not null default '',
  scheduled_days smallint[] not null default '{}' check (scheduled_days <@ array[0,1,2,3,4,5,6]::smallint[]),
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position integer not null check (position >= 0),
  sets smallint not null default 4 check (sets between 1 and 99),
  repetitions text not null default '10–12' check (char_length(trim(repetitions)) between 1 and 40),
  planned_load_kg numeric(7,2) check (planned_load_kg >= 0),
  rest_seconds integer not null default 90 check (rest_seconds between 0 and 3600),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_plan_exercises_position_unique unique(plan_id, position)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  source_plan_id uuid references public.workout_plans(id) on delete set null,
  plan_snapshot jsonb not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists workout_plans_owner_active_idx on public.workout_plans(owner_id, updated_at desc) where deleted_at is null;
create index if not exists workout_plan_exercises_plan_position_idx on public.workout_plan_exercises(plan_id, position);
create index if not exists workout_sessions_owner_started_idx on public.workout_sessions(owner_id, started_at desc);

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_plan_exercises enable row level security;
alter table public.workout_sessions enable row level security;

create policy "profiles readable by signed-in family" on public.profiles for select to authenticated using (true);
create policy "profiles update only self" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "global and owned exercises are readable" on public.exercises for select to authenticated using (owner_id is null or owner_id = (select auth.uid()));
create policy "create personal exercise" on public.exercises for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "modify personal exercise" on public.exercises for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "delete personal exercise" on public.exercises for delete to authenticated using (owner_id = (select auth.uid()));

create policy "read own workout plans" on public.workout_plans for select to authenticated using (owner_id = (select auth.uid()));
create policy "create own workout plans" on public.workout_plans for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "modify own workout plans" on public.workout_plans for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "read items from own plans" on public.workout_plan_exercises for select to authenticated using (exists (select 1 from public.workout_plans p where p.id = plan_id and p.owner_id = (select auth.uid())));
create policy "write items to own plans" on public.workout_plan_exercises for all to authenticated using (exists (select 1 from public.workout_plans p where p.id = plan_id and p.owner_id = (select auth.uid()))) with check (exists (select 1 from public.workout_plans p where p.id = plan_id and p.owner_id = (select auth.uid())));

create policy "read own sessions" on public.workout_sessions for select to authenticated using (owner_id = (select auth.uid()));
create policy "create own session snapshots" on public.workout_sessions for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "update own active sessions" on public.workout_sessions for update to authenticated using (owner_id = (select auth.uid()) and status = 'in_progress') with check (owner_id = (select auth.uid()));

insert into storage.buckets (id, name, public) values ('exercise-media', 'exercise-media', false) on conflict (id) do nothing;
create policy "upload media in own folder" on storage.objects for insert to authenticated with check (bucket_id = 'exercise-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "read own media" on storage.objects for select to authenticated using (bucket_id = 'exercise-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "replace own media" on storage.objects for update to authenticated using (bucket_id = 'exercise-media' and (storage.foldername(name))[1] = (select auth.uid()::text)) with check (bucket_id = 'exercise-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "delete own media" on storage.objects for delete to authenticated using (bucket_id = 'exercise-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
