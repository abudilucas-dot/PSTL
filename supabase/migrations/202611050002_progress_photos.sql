create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  photo_path text not null unique check (char_length(photo_path) between 1 and 500),
  taken_at date not null default current_date,
  caption text not null default '' check (char_length(caption) <= 300),
  shared_with_family boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists progress_photos_owner_taken_idx on public.progress_photos(owner_id, taken_at desc, created_at desc);
alter table public.progress_photos enable row level security;

create policy "read own progress photos"
on public.progress_photos for select to authenticated
using (owner_id = (select auth.uid()));

create policy "family can read shared progress photos"
on public.progress_photos for select to authenticated
using (
  shared_with_family
  and exists (
    select 1
    from public.profiles viewer
    join public.profiles owner on owner.id = progress_photos.owner_id
    where viewer.id = (select auth.uid())
      and viewer.family_group_id is not null
      and viewer.family_group_id = owner.family_group_id
  )
);

create policy "create own progress photos"
on public.progress_photos for insert to authenticated
with check (owner_id = (select auth.uid()));

create policy "update own progress photos"
on public.progress_photos for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "delete own progress photos"
on public.progress_photos for delete to authenticated
using (owner_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress-photos', 'progress-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

create policy "upload own progress photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "read permitted progress photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'progress-photos'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or exists (
      select 1
      from public.progress_photos photo
      join public.profiles viewer on viewer.id = (select auth.uid())
      join public.profiles owner on owner.id = photo.owner_id
      where photo.photo_path = storage.objects.name
        and photo.shared_with_family
        and viewer.family_group_id is not null
        and viewer.family_group_id = owner.family_group_id
    )
  )
);

create policy "delete own progress photo files"
on storage.objects for delete to authenticated
using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
