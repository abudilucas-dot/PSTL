create policy "family groups are not directly readable"
on public.family_groups for select to authenticated
using (false);
