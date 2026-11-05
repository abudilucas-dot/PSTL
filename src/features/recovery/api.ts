import { supabase } from '../../lib/supabase'

const db = () => { if (!supabase) throw new Error('Supabase não configurado.'); return supabase }
export type RecoveryCheckin = { id: string; recorded_at: string; soreness: number; fatigue: number; recovery_quality: number; notes: string }

export async function listRecoveryCheckins(): Promise<RecoveryCheckin[]> {
  const { data, error } = await db().from('recovery_checkins').select('id,recorded_at,soreness,fatigue,recovery_quality,notes').order('recorded_at', { ascending: false }).limit(10)
  if (error) throw error
  return (data ?? []) as RecoveryCheckin[]
}

export async function saveRecoveryCheckin(input: Omit<RecoveryCheckin, 'id' | 'recorded_at'>) {
  const client = db()
  const { data: { user } } = await client.auth.getUser()
  if (!user) throw new Error('Sessão expirada.')
  const { data, error } = await client.from('recovery_checkins').insert({ owner_id: user.id, ...input }).select('id,recorded_at,soreness,fatigue,recovery_quality,notes').single()
  if (error) throw error
  return data as RecoveryCheckin
}
