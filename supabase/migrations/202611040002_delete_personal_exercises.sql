alter table public.workout_plan_exercises
  drop constraint if exists workout_plan_exercises_exercise_id_fkey;

alter table public.workout_plan_exercises
  add constraint workout_plan_exercises_exercise_id_fkey
  foreign key (exercise_id) references public.exercises(id) on delete cascade;
