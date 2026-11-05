import { supabase } from '../../lib/supabase'
import { buildPersonalExport } from '../../lib/personal-export'
import { defaultWorkoutPreferences, normalizeWorkoutPreferences, type WorkoutPreferences } from '../../lib/workout-preferences'

type Profile = { id: string; display_name: string; avatar_path: string | null }

const client = () => {
  if (!supabase) throw new Error('Configure o Supabase para continuar.')
  return supabase
}

async function currentUser() {
  const { data, error } = await client().auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Sua sessão expirou. Entre novamente.')
  return data.user
}

export async function getOwnProfile() {
  const user = await currentUser()
  const { data, error } = await client().from('profiles').select('id, display_name, avatar_path').eq('id', user.id).single()
  if (error) throw error
  return { profile: data as Profile, email: user.email ?? '' }
}

export async function updateOwnProfile(displayName: string) {
  const user = await currentUser()
  const name = displayName.trim()
  if (!name) throw new Error('Informe seu nome.')
  const { data, error } = await client().from('profiles').update({ display_name: name }).eq('id', user.id).select('id, display_name, avatar_path').single()
  if (error) throw error
  return data as Profile
}

export async function uploadProfileAvatar(file: File) {
  const user = await currentUser()
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'image'
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`
  const db = client()
  const { error: uploadError } = await db.storage.from('profile-avatars').upload(path, file, { upsert: false, contentType: file.type })
  if (uploadError) throw uploadError
  const { data, error } = await db.from('profiles').update({ avatar_path: path }).eq('id', user.id).select('id, display_name, avatar_path').single()
  if (error) throw error
  return data as Profile
}

export async function getProfileAvatarUrl(path: string) {
  const { data, error } = await client().storage.from('profile-avatars').createSignedUrl(path, 60 * 60)
  if (error) throw error
  return data.signedUrl
}

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  const user = await currentUser()
  if (!user.email) throw new Error('Não foi possível confirmar o e-mail da conta.')
  if (newPassword.length < 8) throw new Error('A nova senha precisa ter pelo menos 8 caracteres.')
  const { error: verificationError } = await client().auth.signInWithPassword({ email: user.email, password: currentPassword })
  if (verificationError) throw new Error('A senha atual está incorreta.')
  const { error } = await client().auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function signOutEverywhere() {
  const { error } = await client().auth.signOut({ scope: 'global' })
  if (error) throw error
}

export async function getOwnWorkoutPreferences(): Promise<WorkoutPreferences> {
  const user = await currentUser()
  const { data, error } = await client().from('user_preferences').select('default_rest_seconds, sound_enabled, vibration_enabled').eq('owner_id', user.id).maybeSingle()
  if (error) throw error
  return normalizeWorkoutPreferences(data)
}

export async function saveOwnWorkoutPreferences(preferences: WorkoutPreferences) {
  const user = await currentUser()
  const { error } = await client().from('user_preferences').upsert({ owner_id: user.id, default_rest_seconds: preferences.defaultRestSeconds, sound_enabled: preferences.soundEnabled, vibration_enabled: preferences.vibrationEnabled }, { onConflict: 'owner_id' })
  if (error) throw error
  return preferences
}

export async function exportOwnData() {
  const user = await currentUser()
  const db = client()
  const [profileResult, sessionResult, measurementResult, recoveryResult, photoResult] = await Promise.all([
    db.from('profiles').select('display_name').eq('id', user.id).single(),
    db.from('workout_sessions').select('id, status, started_at, completed_at, plan_snapshot, workout_session_exercises(exercise_name, position, planned_sets, planned_repetitions, rest_seconds, notes, workout_sets(set_number, load_kg, repetitions, completed_at))').eq('owner_id', user.id).order('started_at', { ascending: false }),
    db.from('body_measurements').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
    db.from('recovery_checkins').select('id, recorded_at, soreness, fatigue, recovery_quality, notes').eq('owner_id', user.id).order('recorded_at', { ascending: false }),
    db.from('progress_photos').select('id, taken_at, caption, shared_with_family, created_at').eq('owner_id', user.id).order('taken_at', { ascending: false }),
  ])
  const failed = [profileResult, sessionResult, measurementResult, recoveryResult, photoResult].find(result => result.error)
  if (failed?.error) throw failed.error
  if (!profileResult.data) throw new Error('Não foi possível localizar seu perfil para exportação.')
  return buildPersonalExport({
    exportedAt: new Date().toISOString(),
    profile: { display_name: profileResult.data.display_name },
    sessions: sessionResult.data ?? [],
    measurements: measurementResult.data ?? [],
    recoveryCheckins: recoveryResult.data ?? [],
    progressPhotos: photoResult.data ?? [],
  })
}

export function downloadPersonalExport(exported: Awaited<ReturnType<typeof exportOwnData>>) {
  const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `pstl-dados-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
