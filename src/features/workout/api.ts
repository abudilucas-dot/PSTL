import { supabase } from '../../lib/supabase'
import type { PlanExerciseInput } from '../../lib/plan'

const db = () => { if (!supabase) throw new Error('Supabase não configurado.'); return supabase }
export type ActiveSession = { id:string; status:string; started_at:string; workout_session_exercises: Array<{id:string;exercise_name:string;position:number;planned_sets:number;planned_repetitions:string;rest_seconds:number;workout_sets:Array<{id?:string;set_number:number;load_kg:number|null;repetitions:number;completed_at:string|null}>}> }
export async function startWorkout(plan: { id:string; name:string; exercises:PlanExerciseInput[] }, names: Map<string,string>) {
  const client=db(); const {data:{user}}=await client.auth.getUser(); if(!user) throw new Error('Sessão expirada.')
  const snapshot={name:plan.name,exercises:plan.exercises.map(item=>({...item,name:names.get(item.exerciseId)??'Exercício'}))}
  const {data:session,error}=await client.from('workout_sessions').insert({owner_id:user.id,source_plan_id:plan.id,plan_snapshot:snapshot}).select().single(); if(error) throw error
  const rows=plan.exercises.map((item,position)=>({session_id:session.id,exercise_id:item.exerciseId,exercise_name:names.get(item.exerciseId)??'Exercício',position,planned_sets:item.sets,planned_repetitions:item.repetitions,rest_seconds:item.restSeconds,notes:item.notes}))
  const {data:items,error:itemError}=await client.from('workout_session_exercises').insert(rows).select(); if(itemError) throw itemError
  const sets=items.flatMap(item=>Array.from({length:item.planned_sets},(_,index)=>({session_exercise_id:item.id,set_number:index+1,repetitions:0})))
  const {error:setError}=await client.from('workout_sets').insert(sets); if(setError) throw setError
  return session.id
}
export async function getActiveWorkout(){ const client=db(); const {data:{user}}=await client.auth.getUser(); if(!user) return null; const {data,error}=await client.from('workout_sessions').select('id,status,started_at,workout_session_exercises(id,exercise_name,position,planned_sets,planned_repetitions,rest_seconds,workout_sets(id,set_number,load_kg,repetitions,completed_at))').eq('owner_id',user.id).eq('status','in_progress').order('started_at',{ascending:false}).limit(1).maybeSingle(); if(error) throw error; return data as ActiveSession|null }
export async function saveSet(sessionExerciseId:string,setNumber:number,loadKg:number|null,repetitions:number){const {error}=await db().from('workout_sets').update({load_kg:loadKg,repetitions,completed_at:new Date().toISOString()}).eq('session_exercise_id',sessionExerciseId).eq('set_number',setNumber);if(error)throw error}
export async function finishWorkout(id:string){const {error}=await db().from('workout_sessions').update({status:'completed',completed_at:new Date().toISOString()}).eq('id',id);if(error)throw error}
export async function cancelWorkout(id:string){const {error}=await db().from('workout_sessions').update({status:'cancelled',completed_at:new Date().toISOString()}).eq('id',id);if(error)throw error}
export async function addWorkoutSet(sessionExerciseId:string,setNumber:number){const {data,error}=await db().from('workout_sets').insert({session_exercise_id:sessionExerciseId,set_number:setNumber,repetitions:0}).select().single();if(error)throw error;return data}
export async function removeWorkoutSet(sessionExerciseId:string,setNumber:number){const {error}=await db().from('workout_sets').delete().eq('session_exercise_id',sessionExerciseId).eq('set_number',setNumber).is('completed_at',null);if(error)throw error}
