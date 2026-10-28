create table public.workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_name text not null,
  position integer not null check (position >= 0),
  planned_sets smallint not null check (planned_sets between 1 and 99),
  planned_repetitions text not null,
  rest_seconds integer not null default 90 check (rest_seconds between 0 and 3600),
  notes text not null default '',
  unique(session_id, position)
);
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.workout_session_exercises(id) on delete cascade,
  set_number smallint not null check (set_number between 1 and 99),
  load_kg numeric(7,2) check (load_kg >= 0),
  repetitions smallint not null default 0 check (repetitions between 0 and 999),
  completed_at timestamptz,
  notes text not null default '',
  rpe numeric(3,1) check (rpe between 1 and 10),
  unique(session_exercise_id, set_number)
);
create index workout_session_exercises_session_idx on public.workout_session_exercises(session_id, position);
create index workout_sets_session_exercise_idx on public.workout_sets(session_exercise_id, set_number);
alter table public.workout_session_exercises enable row level security;
alter table public.workout_sets enable row level security;
create policy "own session exercises" on public.workout_session_exercises for all to authenticated using (exists(select 1 from public.workout_sessions s where s.id=session_id and s.owner_id=(select auth.uid()))) with check (exists(select 1 from public.workout_sessions s where s.id=session_id and s.owner_id=(select auth.uid())));
create policy "own workout sets" on public.workout_sets for all to authenticated using (exists(select 1 from public.workout_session_exercises e join public.workout_sessions s on s.id=e.session_id where e.id=session_exercise_id and s.owner_id=(select auth.uid()))) with check (exists(select 1 from public.workout_session_exercises e join public.workout_sessions s on s.id=e.session_id where e.id=session_exercise_id and s.owner_id=(select auth.uid())));
