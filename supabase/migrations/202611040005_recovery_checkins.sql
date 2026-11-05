create table public.recovery_checkins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  soreness smallint not null check (soreness between 1 and 5),
  fatigue smallint not null check (fatigue between 1 and 5),
  recovery_quality smallint not null check (recovery_quality between 1 and 5),
  notes text not null default '' check (char_length(notes) <= 1000)
);

create index recovery_checkins_owner_recorded_idx on public.recovery_checkins(owner_id, recorded_at desc);
alter table public.recovery_checkins enable row level security;

create policy "own recovery checkins"
on public.recovery_checkins for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
