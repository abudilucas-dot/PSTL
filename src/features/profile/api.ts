import { supabase } from '../../lib/supabase'

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
