import { supabase } from '../../lib/supabase'
import { normalizePositions, type PlanExerciseInput } from '../../lib/plan'
import { initialWorkoutPlans } from '../../lib/default-plans'

export type WorkoutPlanInput = { id?: string; name: string; description: string; scheduledDays: number[]; exercises: PlanExerciseInput[] }
const client = () => { if (!supabase) throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.') ; return supabase }

export async function listPlans() {
  const { data, error } = await client().from('workout_plans').select('*, workout_plan_exercises(*, exercises(id,name,muscle_group,media_path))').is('deleted_at', null).order('updated_at', { ascending: false })
  if (error) throw error
  return data
}
export async function listExercises() { const { data, error } = await client().from('exercises').select('*').order('name'); if (error) throw error; return data }
export async function createExercise(name: string, muscleGroup = '') { const db = client(); const { data: auth } = await db.auth.getUser(); if (!auth.user) throw new Error('Sessão expirada.'); const { data, error } = await db.from('exercises').insert({ owner_id: auth.user.id, name, muscle_group: muscleGroup }).select().single(); if (error) throw error; return data }
export async function seedInitialPlans() {
  const existing = await listPlans(); if (existing.length) return
  const known = new Map((await listExercises()).map(exercise => [exercise.name, exercise.id]))
  for (const template of initialWorkoutPlans) {
    const exercises: PlanExerciseInput[] = []
    for (const [position, item] of template.exercises.entries()) {
      let exerciseId = known.get(item.name)
      if (!exerciseId) { const created = await createExercise(item.name); exerciseId = created.id; known.set(item.name, exerciseId) }
      exercises.push({ id: crypto.randomUUID(), exerciseId, position, sets: item.sets, repetitions: item.repetitions, plannedLoadKg: null, restSeconds: 90, notes: '' })
    }
    await saveWorkoutPlan({ name: template.name, description: '', scheduledDays: [], exercises })
  }
}

export async function saveWorkoutPlan(input: WorkoutPlanInput) {
  const db = client(); const { data: auth, error: authError } = await db.auth.getUser(); if (authError) throw authError; if (!auth.user) throw new Error('Sessão expirada.')
  const { data: plan, error } = input.id
    ? await db.from('workout_plans').update({ name: input.name, description: input.description, scheduled_days: input.scheduledDays }).eq('id', input.id).select().single()
    : await db.from('workout_plans').insert({ owner_id: auth.user.id, name: input.name, description: input.description, scheduled_days: input.scheduledDays }).select().single()
  if (error) throw error
  const { error: removeError } = await db.from('workout_plan_exercises').delete().eq('plan_id', plan.id); if (removeError) throw removeError
  if (input.exercises.length) {
    const { error: itemError } = await db.from('workout_plan_exercises').insert(normalizePositions(input.exercises).map(({ id, exerciseId, position, sets, repetitions, plannedLoadKg, restSeconds, notes }) => ({ plan_id: plan.id, exercise_id: exerciseId, position, sets, repetitions, planned_load_kg: plannedLoadKg, rest_seconds: restSeconds, notes })))
    if (itemError) throw itemError
  }
  return plan
}

export async function archiveWorkoutPlan(id: string, archived: boolean) { const { error } = await client().from('workout_plans').update({ archived_at: archived ? new Date().toISOString() : null }).eq('id', id); if (error) throw error }
export async function softDeleteWorkoutPlan(id: string) { const { error } = await client().from('workout_plans').update({ deleted_at: new Date().toISOString() }).eq('id', id); if (error) throw error }
export async function duplicateWorkoutPlan(plan: WorkoutPlanInput) { return saveWorkoutPlan({ ...plan, id: undefined, name: `${plan.name} (cópia)` }) }
export async function uploadExerciseMedia(file: File, ownerId: string) { const path = `${ownerId}/${crypto.randomUUID()}-${file.name}`; const { error } = await client().storage.from('exercise-media').upload(path, file, { upsert: false }); if (error) throw error; return path }
