import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Timer } from 'lucide-react'
import type { ActiveSession } from './api'
import { addWorkoutSet, cancelWorkout, finishWorkout, getRunnerExerciseMedia, listExerciseProgress, removeWorkoutSet, saveSet } from './api'
import { canCompleteSet, canRemoveSet, firstIncompleteExerciseIndex, nextSetNumber, sessionSetKey } from '../../lib/session-sets'
import type { WorkoutPreferences } from '../../lib/workout-preferences'
import { lastExercisePerformance } from '../../lib/exercise-progress'

function notifyRestEnd(preferences: WorkoutPreferences) {
  if (preferences.vibrationEnabled && 'vibrate' in navigator) navigator.vibrate([150, 80, 150])
  if (preferences.soundEnabled) try { const context = new AudioContext(); const oscillator = context.createOscillator(); oscillator.frequency.value = 880; oscillator.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .18); window.setTimeout(() => void context.close(), 250) } catch { /* Browser may block non-gesture audio. */ }
}

type ExerciseContext = { muscleGroup: string; mediaPath: string | null; mediaUrl: string | null; last: ReturnType<typeof lastExercisePerformance> }

export function WorkoutRunner({ session, preferences, onClose, onFinished, onCancelled }: { session: ActiveSession; preferences: WorkoutPreferences; onClose: () => void; onFinished: () => void; onCancelled: () => void }) {
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [rest, setRest] = useState(0)
  const [warning, setWarning] = useState('')
  const [exerciseContext, setExerciseContext] = useState<ExerciseContext | null>(null)
  const exercise = session.workout_session_exercises.sort((a, b) => a.position - b.position)[exerciseIndex]
  const notifyWhenRestEnds = useRef(false)

  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  useEffect(() => { if (!rest) return; const id = window.setInterval(() => setRest(value => Math.max(0, value - 1)), 1000); return () => clearInterval(id) }, [rest])
  useEffect(() => { if (rest !== 0 || !notifyWhenRestEnds.current) return; notifyWhenRestEnds.current = false; notifyRestEnd(preferences) }, [rest, preferences])
  useEffect(() => { setExerciseContext(null); void Promise.all([getRunnerExerciseMedia(exercise.exercise_id), listExerciseProgress(exercise.exercise_id)]).then(([media, sessions]) => setExerciseContext({ ...media, last: lastExercisePerformance(sessions) })).catch(error => setWarning(error.message)) }, [exercise.exercise_id])

  const elapsed = useMemo(() => Math.floor((now - new Date(session.started_at).getTime()) / 1000), [now, session.started_at])
  const display = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  const done = async (set: { set_number: number; load_kg: number | null; repetitions: number; completed_at: string | null }, load: number | null, reps: number) => { await saveSet(exercise.id, set.set_number, load, reps); set.completed_at = new Date().toISOString(); set.load_kg = load; set.repetitions = reps; if (exercise.rest_seconds > 0) { notifyWhenRestEnds.current = true; setRest(exercise.rest_seconds) }; setNow(Date.now()) }

  return <main className="runner">
    <header><div><p className="eyebrow">TREINO EM ANDAMENTO · {display(elapsed)}</p><h1>{exercise.exercise_name}</h1><p>{exercise.planned_repetitions} · descanso {exercise.rest_seconds}s</p></div><div className="actions"><button className="ghost" onClick={onClose}>Voltar às fichas</button><button className="danger" onClick={async () => { if (confirm('Encerrar este treino agora? As séries já concluídas serão mantidas, mas o treino ficará cancelado.')) { await cancelWorkout(session.id); onCancelled() } }}>Encerrar treino</button></div></header>
    {warning && <p className="notice">{warning}</p>}
    {exerciseContext && <section className="runner-exercise-context">{exerciseContext.mediaUrl ? exerciseContext.mediaPath?.match(/\.(mp4|webm|mov)$/i) ? <video controls preload="metadata" src={exerciseContext.mediaUrl} /> : <img src={exerciseContext.mediaUrl} alt={`Demonstração de ${exercise.exercise_name}`} /> : <div className="runner-media-placeholder">Demonstração ainda não disponível</div>}<div><p className="eyebrow">{exerciseContext.muscleGroup || 'EXERCÍCIO'}</p>{exerciseContext.last ? <p>Última série: {exerciseContext.last.loadKg ?? '—'} kg × {exerciseContext.last.repetitions} reps</p> : <p>Sem execução anterior registrada.</p>}<small>Demonstração geral; siga a orientação de um profissional habilitado.</small></div></section>}
    {rest > 0 && <div className="rest"><Timer /> Descanso: {display(rest)} <button onClick={() => { notifyWhenRestEnds.current = false; setRest(0) }}>Pular</button></div>}
    <section className="set-list">{exercise.workout_sets.sort((a, b) => a.set_number - b.set_number).map(set => <SetRow key={sessionSetKey(exercise.id, set.set_number)} initial={set} removable={canRemoveSet(exercise.workout_sets, set)} onRemove={async () => { await removeWorkoutSet(exercise.id, set.set_number); exercise.workout_sets = exercise.workout_sets.filter(item => item.set_number !== set.set_number); setNow(Date.now()) }} onDone={(load, reps) => done(set, load, reps)} />)}<button className="ghost" onClick={async () => { const created = await addWorkoutSet(exercise.id, nextSetNumber(exercise.workout_sets)); exercise.workout_sets.push(created); setNow(Date.now()) }}>+ Adicionar série</button></section>
    <footer><button className="icon" disabled={!exerciseIndex} onClick={() => setExerciseIndex(exerciseIndex - 1)}><ChevronLeft /></button><span>{exerciseIndex + 1} de {session.workout_session_exercises.length}</span>{exerciseIndex < session.workout_session_exercises.length - 1 ? <button className="icon" onClick={() => setExerciseIndex(exerciseIndex + 1)}><ChevronRight /></button> : <button onClick={async () => { const missing = firstIncompleteExerciseIndex(session.workout_session_exercises); if (missing >= 0) { setExerciseIndex(missing); setWarning('Há séries pendentes. Conclua ou remova as séries restantes antes de finalizar.'); return } await finishWorkout(session.id); onFinished() }}><Check />Finalizar treino</button>}</footer>
  </main>
}

function SetRow({ initial, onDone, removable, onRemove }: { initial: { set_number: number; load_kg: number | null; repetitions: number; completed_at: string | null }; onDone: (load: number | null, reps: number) => Promise<void>; removable: boolean; onRemove: () => Promise<void> }) {
  const [load, setLoad] = useState(initial.load_kg?.toString() ?? '')
  const [reps, setReps] = useState(initial.repetitions || '')
  const [busy, setBusy] = useState(false)
  const locked = Boolean(initial.completed_at)
  return <article className={`set ${locked ? 'done' : ''}`}><b>Série {initial.set_number}</b><label>kg<input disabled={locked} inputMode="decimal" value={load} onChange={event => setLoad(event.target.value)} /></label><label>reps<input disabled={locked} inputMode="numeric" value={reps} onChange={event => setReps(event.target.value)} /></label><button disabled={busy || !canCompleteSet(initial.completed_at, Number(reps))} onClick={async () => { setBusy(true); await onDone(load === '' ? null : Number(load), Number(reps)); setBusy(false) }}>{locked ? 'Concluída' : 'Concluir'}</button>{removable && <button className="ghost" onClick={onRemove}>Remover</button>}</article>
}
