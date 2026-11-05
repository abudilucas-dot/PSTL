create table if not exists public.user_preferences (
  owner_id uuid primary key references public.profiles(id) on delete cascade,
  default_rest_seconds integer not null default 90 check (default_rest_seconds between 0 and 3600),
  sound_enabled boolean not null default false,
  vibration_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "read own preferences"
on public.user_preferences for select to authenticated
using (owner_id = (select auth.uid()));

create policy "create own preferences"
on public.user_preferences for insert to authenticated
with check (owner_id = (select auth.uid()));

create policy "update own preferences"
on public.user_preferences for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
