import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Dumbbell, ImagePlus, Pencil, Plus, Save, Search, Trash2, Upload, X } from 'lucide-react'
import { createExercise, deleteExercise, getExerciseMediaUrl, listExercises, setExerciseMedia, updateExercise } from '../plans/api'
import { isSupportedExerciseMedia } from '../../lib/exercise-media'
import { canManageExercise } from '../../lib/exercise-library'
import { supabase } from '../../lib/supabase'

type Exercise = { id: string; owner_id: string | null; name: string; description: string; muscle_group: string; media_path: string | null }

function MediaPreview({ path, name }: { path: string | null; name: string }) {
  const [url, setUrl] = useState('')
  useEffect(() => { if (!path) return; getExerciseMediaUrl(path).then(setUrl).catch(() => setUrl('')) }, [path])
  if (!url) return <div className="exercise-media-placeholder"><Dumbbell /><span>Sem demonstração</span></div>
  return path?.match(/\.(mp4|webm|mov)$/i) ? <video className="exercise-media" controls preload="metadata" src={url} /> : <img className="exercise-media" src={url} alt={`Demonstração de ${name}`} />
}

function ExerciseCard({ exercise, userId, uploading, onUpload, onChanged, onNotice }: { exercise: Exercise; userId: string; uploading: boolean; onUpload: (file?: File) => void; onChanged: () => Promise<void>; onNotice: (message: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(exercise.name)
  const [muscleGroup, setMuscleGroup] = useState(exercise.muscle_group)
  const [description, setDescription] = useState(exercise.description)
  const [saving, setSaving] = useState(false)
  const canManage = canManageExercise(exercise.owner_id, userId)
  const save = async () => {
    if (!name.trim()) return onNotice('O exercício precisa de um nome.')
    setSaving(true)
    try { await updateExercise(exercise.id, { name, muscleGroup, description }); setEditing(false); onNotice('Exercício atualizado.'); await onChanged() } catch (error: any) { onNotice(error.message) } finally { setSaving(false) }
  }
  const remove = async () => {
    if (!confirm(`Excluir “${exercise.name}”? Ele será removido das fichas futuras, mas o histórico de treinos já concluídos será preservado.`)) return
    setSaving(true)
    try { await deleteExercise(exercise.id); onNotice('Exercício excluído.'); await onChanged() } catch (error: any) { onNotice(error.message) } finally { setSaving(false) }
  }
  const cancel = () => { setName(exercise.name); setMuscleGroup(exercise.muscle_group); setDescription(exercise.description); setEditing(false) }

  return <article className="exercise-card"><MediaPreview path={exercise.media_path} name={exercise.name} /><div>{editing ? <div className="exercise-edit"><input aria-label="Nome do exercício" value={name} onChange={event => setName(event.target.value)} /><input aria-label="Grupo muscular" placeholder="Grupo muscular" value={muscleGroup} onChange={event => setMuscleGroup(event.target.value)} /><textarea aria-label="Descrição do exercício" placeholder="Descrição ou observações" value={description} onChange={event => setDescription(event.target.value)} /><div className="card-actions"><button disabled={saving} onClick={save}><Save />Salvar</button><button className="icon" aria-label="Cancelar edição" onClick={cancel}><X /></button></div></div> : <><p className="eyebrow">{exercise.muscle_group || 'SEM GRUPO'}</p><h2>{exercise.name}</h2>{exercise.description && <p>{exercise.description}</p>}{canManage ? <div className="card-actions"><label className="media-upload"><ImagePlus />{uploading ? 'Enviando…' : 'Mídia'}<input type="file" accept="image/*,video/*" disabled={uploading} onChange={event => onUpload(event.target.files?.[0])} /></label><button className="icon" aria-label="Editar exercício" onClick={() => setEditing(true)}><Pencil /></button><button className="icon danger" aria-label="Excluir exercício" onClick={remove}><Trash2 /></button></div> : <small>Exercício compartilhado: somente leitura.</small>}</>}</div></article>
}

export function ExerciseLibrary({ onBack }: { onBack: () => void }) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [userId, setUserId] = useState('')
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')
  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [notice, setNotice] = useState('')
  const [uploading, setUploading] = useState('')
  const load = async () => { try { const data = await listExercises(); setExercises(data as Exercise[]); const { data: auth } = await supabase!.auth.getUser(); setUserId(auth.user?.id ?? '') } catch (error: any) { setNotice(error.message) } }
  useEffect(() => { void load() }, [])
  const groups = useMemo(() => [...new Set(exercises.map(exercise => exercise.muscle_group).filter(Boolean))].sort(), [exercises])
  const visibleExercises = exercises.filter(exercise => (!group || exercise.muscle_group === group) && exercise.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')))
  const addExercise = async (event: React.FormEvent) => { event.preventDefault(); if (!name.trim()) return setNotice('Informe o nome do exercício.'); try { await createExercise(name.trim(), muscleGroup.trim()); setName(''); setMuscleGroup(''); setNotice('Exercício criado na sua biblioteca.'); await load() } catch (error: any) { setNotice(error.message) } }
  const upload = async (exercise: Exercise, file?: File) => { if (!file) return; if (!isSupportedExerciseMedia(file.type, file.size)) return setNotice('Envie uma imagem ou vídeo de até 20 MB.'); setUploading(exercise.id); try { await setExerciseMedia(exercise.id, file); setNotice('Demonstração atualizada.'); await load() } catch (error: any) { setNotice(error.message) } finally { setUploading('') } }

  return <main className="history-page exercise-library-page"><header><button className="icon" onClick={onBack}><ArrowLeft /></button><div><p className="eyebrow">BIBLIOTECA</p><h1>Exercícios</h1></div></header><form className="exercise-create" onSubmit={addExercise}><input placeholder="Novo exercício" value={name} onChange={event => setName(event.target.value)} /><input placeholder="Grupo muscular" value={muscleGroup} onChange={event => setMuscleGroup(event.target.value)} /><button><Plus />Criar exercício</button></form><div className="exercise-filters"><label><Search /><input placeholder="Buscar exercício" value={query} onChange={event => setQuery(event.target.value)} /></label><select value={group} onChange={event => setGroup(event.target.value)}><option value="">Todos os grupos</option>{groups.map(item => <option key={item} value={item}>{item}</option>)}</select></div><p className="notice" role="status">{notice}</p><section className="exercise-library-grid">{visibleExercises.map(exercise => <ExerciseCard key={exercise.id} exercise={exercise} userId={userId} uploading={uploading === exercise.id} onUpload={file => void upload(exercise, file)} onChanged={load} onNotice={setNotice} />)}</section>{!visibleExercises.length && <div className="empty"><Upload /><h2>Nenhum exercício encontrado</h2><p>Crie um exercício próprio ou ajuste os filtros.</p></div>}</main>
}
