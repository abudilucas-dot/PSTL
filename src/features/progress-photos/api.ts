import { supabase } from '../../lib/supabase'

export type ProgressPhoto = { id: string; owner_id: string; photo_path: string; taken_at: string; caption: string; shared_with_family: boolean; created_at: string; url: string }
type StoredPhoto = Omit<ProgressPhoto, 'url'>

const client = () => { if (!supabase) throw new Error('Configure o Supabase para continuar.'); return supabase }
const selectFields = 'id, owner_id, photo_path, taken_at, caption, shared_with_family, created_at'

async function currentUser() {
  const { data, error } = await client().auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Sua sessão expirou. Entre novamente.')
  return data.user
}

async function withSignedUrl(photo: StoredPhoto): Promise<ProgressPhoto> {
  const { data, error } = await client().storage.from('progress-photos').createSignedUrl(photo.photo_path, 60 * 60)
  if (error) throw error
  return { ...photo, url: data.signedUrl }
}

export async function listOwnProgressPhotos() {
  const user = await currentUser()
  const { data, error } = await client().from('progress_photos').select(selectFields).eq('owner_id', user.id).order('taken_at', { ascending: false }).order('created_at', { ascending: false })
  if (error) throw error
  return Promise.all((data as StoredPhoto[]).map(withSignedUrl))
}

export async function listSharedProgressPhotos(ownerId: string) {
  const { data, error } = await client().from('progress_photos').select(selectFields).eq('owner_id', ownerId).eq('shared_with_family', true).order('taken_at', { ascending: false })
  if (error) throw error
  return Promise.all((data as StoredPhoto[]).map(withSignedUrl))
}

export async function uploadProgressPhoto(file: File, input: { takenAt: string; caption: string }) {
  const user = await currentUser()
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'image'
  const photoPath = `${user.id}/${crypto.randomUUID()}.${extension}`
  const db = client()
  const { error: uploadError } = await db.storage.from('progress-photos').upload(photoPath, file, { upsert: false, contentType: file.type })
  if (uploadError) throw uploadError
  const { data, error } = await db.from('progress_photos').insert({ owner_id: user.id, photo_path: photoPath, taken_at: input.takenAt, caption: input.caption.trim() }).select(selectFields).single()
  if (error || !data) throw error ?? new Error('Não foi possível salvar a foto.')
  return withSignedUrl(data as StoredPhoto)
}

export async function setProgressPhotoSharing(id: string, shared: boolean) {
  const { data, error } = await client().from('progress_photos').update({ shared_with_family: shared }).eq('id', id).select(selectFields).single()
  if (error || !data) throw error ?? new Error('Não foi possível atualizar a privacidade da foto.')
  return withSignedUrl(data as StoredPhoto)
}

export async function deleteProgressPhoto(photo: Pick<ProgressPhoto, 'id' | 'photo_path'>) {
  const { error } = await client().from('progress_photos').delete().eq('id', photo.id)
  if (error) throw error
  await client().storage.from('progress-photos').remove([photo.photo_path])
}
