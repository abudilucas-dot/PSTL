create table if not exists public.family_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);

alter table public.family_groups enable row level security;

alter table public.profiles
  add column if not exists family_group_id uuid references public.family_groups(id) on delete restrict;

insert into public.family_groups (name)
values ('Família PSTL')
on conflict (name) do nothing;

update public.profiles
set family_group_id = (select id from public.family_groups where name = 'Família PSTL')
where family_group_id is null;

create or replace function public.prevent_profile_family_group_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.family_group_id is distinct from old.family_group_id then
    raise exception 'O grupo da família não pode ser alterado pelo aplicativo.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_profile_family_group_change on public.profiles;
create trigger prevent_profile_family_group_change
before update on public.profiles
for each row execute function public.prevent_profile_family_group_change();

create policy "family can read session summaries"
on public.workout_sessions for select to authenticated
using (
  exists (
    select 1
    from public.profiles viewer
    join public.profiles owner on owner.id = workout_sessions.owner_id
    where viewer.id = (select auth.uid())
      and viewer.family_group_id is not null
      and viewer.family_group_id = owner.family_group_id
  )
);

create policy "family can read session exercises"
on public.workout_session_exercises for select to authenticated
using (
  exists (
    select 1
    from public.workout_sessions session
    join public.profiles viewer on viewer.id = (select auth.uid())
    join public.profiles owner on owner.id = session.owner_id
    where session.id = workout_session_exercises.session_id
      and viewer.family_group_id is not null
      and viewer.family_group_id = owner.family_group_id
  )
);

create policy "family can read workout sets"
on public.workout_sets for select to authenticated
using (
  exists (
    select 1
    from public.workout_session_exercises exercise
    join public.workout_sessions session on session.id = exercise.session_id
    join public.profiles viewer on viewer.id = (select auth.uid())
    join public.profiles owner on owner.id = session.owner_id
    where exercise.id = workout_sets.session_exercise_id
      and viewer.family_group_id is not null
      and viewer.family_group_id = owner.family_group_id
  )
);
