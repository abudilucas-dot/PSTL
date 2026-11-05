import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BarChart3, Dumbbell, ImagePlus, Pencil, Plus, Save, Search, Trash2, Upload, X } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { createExercise, deleteExercise, getExerciseMediaUrl, listExercises, setExerciseMedia, updateExercise } from '../plans/api'
import { listExerciseProgress } from '../workout/api'
import { exerciseProgress, type ExerciseSession } from '../../lib/exercise-progress'
import { isSupportedExerciseMedia } from '../../lib/exercise-media'
import { canManageExercise } from '../../lib/exercise-library'
import { supabase } from '../../lib/supabase'
import { formatTrainingVolume } from '../../lib/volume'

type Exercise = { id: string; owner_id: string | null; name: string; description: string; muscle_group: string; media_path: string | null }
type Metric = 'maxLoadKg' | 'repetitions' | 'volume'
const metricLabels: Record<Metric, string> = { maxLoadKg: 'Maior carga', repetitions: 'Repetições', volume: 'Volume da sessão' }

function MediaPreview({ path, name }: { path: string | null; name: string }) {
  const [url, setUrl] = useState('')
  useEffect(() => { if (!path) { setUrl(''); return }; getExerciseMediaUrl(path).then(setUrl).catch(() => setUrl('')) }, [path])
  if (!url) return <div className="exercise-media-placeholder"><Dumbbell /><span>Sem demonstração</span></div>
  return path?.match(/\.(mp4|webm|mov)$/i) ? <video className="exercise-media" controls preload="metadata" src={url} /> : <img className="exercise-media" src={url} alt={`Demonstração de ${name}`} />
}

function ExerciseDetail({ exercise, onBack }: { exercise: Exercise; onBack: () => void }) {
  const [sessions, setSessions] = useState<ExerciseSession[]>([])
  const [metric, setMetric] = useState<Metric>('maxLoadKg')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { listExerciseProgress(exercise.id).then(loaded => { setSessions(loaded); setSelectedSessionId(loaded.at(-1)?.sessionId ?? '') }).catch(reason => setError(reason.message)) }, [exercise.id])
  const progress = useMemo(() => exerciseProgress(sessions), [sessions])
  const selected = progress.last && (sessions.find(session => session.sessionId === selectedSessionId) ?? progress.last)
  const lastPoint = progress.last?.point
  const valueFormatter = (value: number) => metric === 'volume' ? formatTrainingVolume(value) : metric === 'maxLoadKg' ? `${value.toLocaleString('pt-BR')} kg` : `${value} reps`
  return <main className="history-page exercise-detail-page">
    <header><button className="icon" onClick={onBack} aria-label="Voltar à biblioteca"><ArrowLeft /></button><div><p className="eyebrow">EXERCÍCIO</p><h1>{exercise.name}</h1><p>{exercise.muscle_group || 'Grupo muscular não definido'}</p></div></header>
    <section className="exercise-detail-hero"><MediaPreview path={exercise.media_path} name={exercise.name} /><div>{exercise.description && <p>{exercise.description}</p>}<p className="media-disclaimer">Demonstração geral. Ajuste a execução às orientações de um profissional habilitado.</p></div></section>
    {error && <p className="notice">{error}</p>}
    {!progress.points.length && !error ? <div className="empty"><BarChart3 /><h2>Sem registros para este exercício</h2><p>Conclua uma série para criar o histórico pessoal de carga e repetições.</p></div> : progress.points.length > 0 && <>
      <section className="stat-grid exercise-progress-stats"><article><Dumbbell /><strong>{lastPoint ? valueFormatter(lastPoint.maxLoadKg) : '—'}</strong><span>maior carga na última execução</span></article><article><BarChart3 /><strong>{progress.maxLoadKg.toLocaleString('pt-BR')} kg</strong><span>maior carga registrada</span></article><article><BarChart3 /><strong>{formatTrainingVolume(progress.maxSessionVolume)}</strong><span>maior volume de sessão</span></article></section>
      <section className="chart-card exercise-progress-chart"><div className="chart-heading"><h2>Evolução pessoal</h2><select aria-label="Métrica do gráfico" value={metric} onChange={event => setMetric(event.target.value as Metric)}>{(Object.keys(metricLabels) as Metric[]).map(item => <option key={item} value={item}>{metricLabels[item]}</option>)}</select></div><ResponsiveContainer width="100%" height={260}><LineChart data={progress.points} title={`Evolução de ${exercise.name}`}><CartesianGrid stroke="#3b5142" vertical={false} /><XAxis dataKey="date" stroke="#a9b8ae" /><YAxis stroke="#a9b8ae" tickFormatter={value => metric === 'volume' ? formatTrainingVolume(Number(value)) : String(value)} /><Tooltip contentStyle={{ background: '#19261e', border: '1px solid #3b5142' }} formatter={value => valueFormatter(Number(value))} labelFormatter={label => `Sessão: ${label}`} /><Line type="monotone" dataKey={metric} name={metricLabels[metric]} stroke="#7ddc99" strokeWidth={3} dot={{ fill: '#a8e6b7' }} /></LineChart></ResponsiveContainer></section>
      <section className="exercise-session-history"><h2>Execuções registradas</h2><div className="exercise-session-tabs">{[...progress.points].reverse().map(point => <button className={point.sessionId === selected?.sessionId ? 'selected' : 'ghost'} key={point.sessionId} onClick={() => setSelectedSessionId(point.sessionId)}>{point.date}<small>{valueFormatter(point[metric])}</small></button>)}</div>{selected && <article className="selected-exercise-session"><h3>{new Date(selected.startedAt).toLocaleString('pt-BR')}</h3><div className="session-sets">{selected.sets.filter(set => set.completed_at).map((set, index) => <div className="session-set done" key={`${set.completed_at}-${index}`}><b>Série {index + 1}</b><span>{set.load_kg ?? '—'} kg × {set.repetitions} reps</span></div>)}</div></article>}</section>
    </>}
  </main>
}

function ExerciseCard({ exercise, userId, uploading, onUpload, onChanged, onNotice, onOpen }: { exercise: Exercise; userId: string; uploading: boolean; onUpload: (file?: File) => void; onChanged: () => Promise<void>; onNotice: (message: string) => void; onOpen: () => void }) {
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
  return <article className="exercise-card"><MediaPreview path={exercise.media_path} name={exercise.name} /><div>{editing ? <div className="exercise-edit"><input aria-label="Nome do exercício" value={name} onChange={event => setName(event.target.value)} /><input aria-label="Grupo muscular" placeholder="Grupo muscular" value={muscleGroup} onChange={event => setMuscleGroup(event.target.value)} /><textarea aria-label="Descrição do exercício" placeholder="Descrição ou observações" value={description} onChange={event => setDescription(event.target.value)} /><div className="card-actions"><button disabled={saving} onClick={save}><Save />Salvar</button><button className="icon" aria-label="Cancelar edição" onClick={cancel}><X /></button></div></div> : <><p className="eyebrow">{exercise.muscle_group || 'SEM GRUPO'}</p><h2>{exercise.name}</h2>{exercise.description && <p>{exercise.description}</p>}<div className="card-actions"><button className="ghost card-open" onClick={onOpen}><BarChart3 />Evolução</button>{canManage && <><label className="media-upload"><ImagePlus />{uploading ? 'Enviando…' : 'Mídia'}<input type="file" accept="image/*,video/*" disabled={uploading} onChange={event => onUpload(event.target.files?.[0])} /></label><button className="icon" aria-label="Editar exercício" onClick={() => setEditing(true)}><Pencil /></button><button className="icon danger" aria-label="Excluir exercício" onClick={remove}><Trash2 /></button></>}</div>{!canManage && <small>Exercício compartilhado: somente leitura.</small>}</>}</div></article>
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
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const load = async () => { try { const data = await listExercises(); setExercises(data as Exercise[]); const { data: auth } = await supabase!.auth.getUser(); setUserId(auth.user?.id ?? '') } catch (error: any) { setNotice(error.message) } }
  useEffect(() => { void load() }, [])
  const groups = useMemo(() => [...new Set(exercises.map(exercise => exercise.muscle_group).filter(Boolean))].sort(), [exercises])
  const visibleExercises = exercises.filter(exercise => (!group || exercise.muscle_group === group) && exercise.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')))
  const selectedExercise = exercises.find(exercise => exercise.id === selectedExerciseId)
  const addExercise = async (event: React.FormEvent) => { event.preventDefault(); if (!name.trim()) return setNotice('Informe o nome do exercício.'); try { await createExercise(name.trim(), muscleGroup.trim()); setName(''); setMuscleGroup(''); setNotice('Exercício criado na sua biblioteca.'); await load() } catch (error: any) { setNotice(error.message) } }
  const upload = async (exercise: Exercise, file?: File) => { if (!file) return; if (!isSupportedExerciseMedia(file.type, file.size)) return setNotice('Envie uma imagem ou vídeo de até 20 MB.'); setUploading(exercise.id); try { await setExerciseMedia(exercise.id, file); setNotice('Demonstração atualizada.'); await load() } catch (error: any) { setNotice(error.message) } finally { setUploading('') } }
  if (selectedExercise) return <ExerciseDetail exercise={selectedExercise} onBack={() => setSelectedExerciseId('')} />
  return <main className="history-page exercise-library-page"><header><button className="icon" onClick={onBack}><ArrowLeft /></button><div><p className="eyebrow">BIBLIOTECA</p><h1>Exercícios</h1></div></header><form className="exercise-create" onSubmit={addExercise}><input placeholder="Novo exercício" value={name} onChange={event => setName(event.target.value)} /><input placeholder="Grupo muscular" value={muscleGroup} onChange={event => setMuscleGroup(event.target.value)} /><button><Plus />Criar exercício</button></form><div className="exercise-filters"><label><Search /><input placeholder="Buscar exercício" value={query} onChange={event => setQuery(event.target.value)} /></label><select value={group} onChange={event => setGroup(event.target.value)}><option value="">Todos os grupos</option>{groups.map(item => <option key={item} value={item}>{item}</option>)}</select></div><p className="notice" role="status">{notice}</p><section className="exercise-library-grid">{visibleExercises.map(exercise => <ExerciseCard key={exercise.id} exercise={exercise} userId={userId} uploading={uploading === exercise.id} onUpload={file => void upload(exercise, file)} onChanged={load} onNotice={setNotice} onOpen={() => setSelectedExerciseId(exercise.id)} />)}</section>{!visibleExercises.length && <div className="empty"><Upload /><h2>Nenhum exercício encontrado</h2><p>Crie um exercício próprio ou ajuste os filtros.</p></div>}</main>
}
