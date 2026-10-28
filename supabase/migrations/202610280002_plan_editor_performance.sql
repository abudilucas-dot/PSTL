create index if not exists workout_plan_exercises_exercise_idx on public.workout_plan_exercises(exercise_id);
create index if not exists workout_sessions_source_plan_idx on public.workout_sessions(source_plan_id);

drop policy if exists "write items to own plans" on public.workout_plan_exercises;

create policy "insert items to own plans"
on public.workout_plan_exercises for insert to authenticated
with check (exists (select 1 from public.workout_plans p where p.id = plan_id and p.owner_id = (select auth.uid())));

create policy "update items in own plans"
on public.workout_plan_exercises for update to authenticated
using (exists (select 1 from public.workout_plans p where p.id = plan_id and p.owner_id = (select auth.uid())))
with check (exists (select 1 from public.workout_plans p where p.id = plan_id and p.owner_id = (select auth.uid())));

create policy "delete items from own plans"
on public.workout_plan_exercises for delete to authenticated
using (exists (select 1 from public.workout_plans p where p.id = plan_id and p.owner_id = (select auth.uid())));
