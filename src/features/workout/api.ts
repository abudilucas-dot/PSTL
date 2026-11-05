import { supabase } from '../../lib/supabase'
import type { PlanExerciseInput } from '../../lib/plan'
import type { FamilyMember, FamilySession } from '../../lib/family'
import type { ExerciseSession } from '../../lib/exercise-progress'

const db = () => { if (!supabase) throw new Error('Supabase não configurado.'); return supabase }
export type ActiveSession = { id:string; status:string; started_at:string; workout_session_exercises: Array<{id:string;exercise_id:string;exercise_name:string;position:number;planned_sets:number;planned_repetitions:string;rest_seconds:number;workout_sets:Array<{id?:string;set_number:number;load_kg:number|null;repetitions:number;completed_at:string|null}>}> }
export async function startWorkout(plan: { id:string; name:string; exercises:PlanExerciseInput[] }, names: Map<string,string>): Promise<ActiveSession> {
  const client=db(); const {data:{user}}=await client.auth.getUser(); if(!user) throw new Error('Sessão expirada.')
  const snapshot={name:plan.name,exercises:plan.exercises.map(item=>({...item,name:names.get(item.exerciseId)??'Exercício'}))}
  const {data:session,error}=await client.from('workout_sessions').insert({owner_id:user.id,source_plan_id:plan.id,plan_snapshot:snapshot}).select().single(); if(error) throw error
  const rows=plan.exercises.map((item,position)=>({session_id:session.id,exercise_id:item.exerciseId,exercise_name:names.get(item.exerciseId)??'Exercício',position,planned_sets:item.sets,planned_repetitions:item.repetitions,rest_seconds:item.restSeconds,notes:item.notes}))
  const {data:items,error:itemError}=await client.from('workout_session_exercises').insert(rows).select(); if(itemError) throw itemError
  const sets=items.flatMap(item=>Array.from({length:item.planned_sets},(_,index)=>({session_exercise_id:item.id,set_number:index+1,repetitions:0})))
  const {data:createdSets,error:setError}=await client.from('workout_sets').insert(sets).select('id,session_exercise_id,set_number,load_kg,repetitions,completed_at'); if(setError) throw setError
  return {id:session.id,status:session.status,started_at:session.started_at,workout_session_exercises:items.map(item=>({id:item.id,exercise_id:item.exercise_id,exercise_name:item.exercise_name,position:item.position,planned_sets:item.planned_sets,planned_repetitions:item.planned_repetitions,rest_seconds:item.rest_seconds,workout_sets:(createdSets??[]).filter(set=>set.session_exercise_id===item.id).map(set=>({id:set.id,set_number:set.set_number,load_kg:set.load_kg,repetitions:set.repetitions,completed_at:set.completed_at}))}))}
}
export async function getActiveWorkout(){ const client=db(); const {data:{user}}=await client.auth.getUser(); if(!user) return null; const {data,error}=await client.from('workout_sessions').select('id,status,started_at,workout_session_exercises(id,exercise_id,exercise_name,position,planned_sets,planned_repetitions,rest_seconds,workout_sets(id,set_number,load_kg,repetitions,completed_at))').eq('owner_id',user.id).eq('status','in_progress').order('started_at',{ascending:false}).limit(1).maybeSingle(); if(error) throw error; return data as ActiveSession|null }
export async function saveSet(sessionExerciseId:string,setNumber:number,loadKg:number|null,repetitions:number){const {error}=await db().from('workout_sets').update({load_kg:loadKg,repetitions,completed_at:new Date().toISOString()}).eq('session_exercise_id',sessionExerciseId).eq('set_number',setNumber);if(error)throw error}
export async function finishWorkout(id:string){const {error}=await db().from('workout_sessions').update({status:'completed',completed_at:new Date().toISOString()}).eq('id',id);if(error)throw error}
export async function cancelWorkout(id:string){const {error}=await db().from('workout_sessions').update({status:'cancelled',completed_at:new Date().toISOString()}).eq('id',id);if(error)throw error}
export async function addWorkoutSet(sessionExerciseId:string,setNumber:number){const {data,error}=await db().from('workout_sets').insert({session_exercise_id:sessionExerciseId,set_number:setNumber,repetitions:0}).select().single();if(error)throw error;return data}
export async function removeWorkoutSet(sessionExerciseId:string,setNumber:number){const {error}=await db().from('workout_sets').delete().eq('session_exercise_id',sessionExerciseId).eq('set_number',setNumber).is('completed_at',null);if(error)throw error}
export async function listWorkoutHistory(){const client=db();const {data:{user}}=await client.auth.getUser();if(!user)return[];const {data,error}=await client.from('workout_sessions').select('id,status,started_at,completed_at,plan_snapshot,workout_session_exercises(exercise_name,position,planned_repetitions,notes,workout_sets(set_number,completed_at,load_kg,repetitions))').eq('owner_id',user.id).in('status',['completed','cancelled']).order('started_at',{ascending:false});if(error)throw error;return data}
export async function listExerciseProgress(exerciseId: string): Promise<ExerciseSession[]> {
  const { data, error } = await db().from('workout_session_exercises').select('workout_sessions!inner(id,started_at,status),workout_sets(completed_at,load_kg,repetitions)').eq('exercise_id', exerciseId).eq('workout_sessions.status', 'completed')
  if (error) throw error
  return (data ?? []).map((entry: any) => ({ sessionId: entry.workout_sessions.id, startedAt: entry.workout_sessions.started_at, sets: entry.workout_sets }))
}
export async function getRunnerExerciseMedia(exerciseId: string) {
  const { data, error } = await db().from('exercises').select('muscle_group, media_path').eq('id', exerciseId).single()
  if (error) throw error
  if (!data.media_path) return { muscleGroup: data.muscle_group, mediaPath: null, mediaUrl: null }
  const { data: signed, error: signedError } = await db().storage.from('exercise-media').createSignedUrl(data.media_path, 60 * 60)
  if (signedError) throw signedError
  return { muscleGroup: data.muscle_group, mediaPath: data.media_path, mediaUrl: signed.signedUrl }
}
export async function listFamilyProgress(): Promise<{ members: FamilyMember[]; sessions: FamilySession[] }> {
  const client = db()
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('Sessão expirada.')
  const { data: viewer, error: viewerError } = await client.from('profiles').select('family_group_id').eq('id', user.id).single()
  if (viewerError) throw viewerError
  if (!viewer.family_group_id) return { members: [], sessions: [] }
  const [{ data: members, error: memberError }, { data: sessions, error: sessionError }] = await Promise.all([
    client.from('profiles').select('id,display_name,avatar_path').eq('family_group_id', viewer.family_group_id).order('display_name'),
    client.from('workout_sessions').select('owner_id,status,started_at,plan_snapshot,workout_session_exercises(workout_sets(completed_at,load_kg,repetitions))').in('status', ['completed', 'cancelled']).order('started_at', { ascending: false }),
  ])
  if (memberError) throw memberError
  if (sessionError) throw sessionError
  return { members: (members ?? []) as FamilyMember[], sessions: (sessions ?? []) as FamilySession[] }
}
