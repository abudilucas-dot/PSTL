import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Dumbbell, History as HistoryIcon } from 'lucide-react'
import { listWorkoutHistory } from '../workout/api'
import { completedSetCount, historyVolume } from '../../lib/history'
import { calendarCells, historyDateKey } from '../../lib/history-calendar'
import { formatTrainingVolume } from '../../lib/volume'

type WorkoutSet = { set_number: number; completed_at: string | null; load_kg: number | null; repetitions: number }
type WorkoutExercise = { exercise_name: string; position: number; planned_repetitions: string; notes: string; workout_sets: WorkoutSet[] }
type HistorySession = { id: string; status: 'completed' | 'cancelled'; started_at: string; completed_at: string | null; plan_snapshot: { name?: string } | null; workout_session_exercises: WorkoutExercise[] }
const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const sessionName = (session: HistorySession) => session.plan_snapshot?.name ?? 'Treino'

function SessionDetail({ session, onBack }: { session: HistorySession; onBack: () => void }) {
  const sets = session.workout_session_exercises.flatMap(exercise => exercise.workout_sets)
  return <main className="history-page history-detail-page">
    <header><button className="icon" onClick={onBack} aria-label="Voltar ao histórico"><ArrowLeft /></button><div><p className="eyebrow">SESSÃO REGISTRADA</p><h1>{sessionName(session)}</h1><p>{new Date(session.started_at).toLocaleString('pt-BR')} · {session.status === 'completed' ? 'Concluído' : 'Encerrado'}</p></div></header>
    <section className="stat-grid history-detail-stats"><article><Dumbbell /><strong>{completedSetCount(sets)}</strong><span>séries concluídas</span></article><article><CalendarDays /><strong>{formatTrainingVolume(historyVolume(sets))}</strong><span>volume movimentado</span></article></section>
    <section className="session-exercise-list">{[...session.workout_session_exercises].sort((a, b) => a.position - b.position).map(exercise => <article className="session-exercise" key={`${exercise.position}-${exercise.exercise_name}`}><h2>{exercise.exercise_name}</h2><p>{exercise.planned_repetitions}</p><div className="session-sets">{[...exercise.workout_sets].sort((a, b) => a.set_number - b.set_number).map(set => <div className={set.completed_at ? 'session-set done' : 'session-set'} key={set.set_number}><b>Série {set.set_number}</b><span>{set.completed_at ? `${set.load_kg ?? '—'} kg × ${set.repetitions} reps` : 'Não concluída'}</span></div>)}</div>{exercise.notes && <p className="session-notes">Obs.: {exercise.notes}</p>}</article>)}</section>
  </main>
}

export function History({ onBack }: { onBack: () => void }) {
  const [sessions, setSessions] = useState<HistorySession[]>([])
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [month, setMonth] = useState(() => new Date())
  useEffect(() => { listWorkoutHistory().then(data => { const loaded = data as HistorySession[]; setSessions(loaded); if (loaded[0]) setMonth(new Date(loaded[0].started_at)) }).catch(reason => setError(reason.message)) }, [])
  const cells = useMemo(() => calendarCells(month.getFullYear(), month.getMonth(), sessions), [month, sessions])
  const visibleSessions = useMemo(() => selectedDate ? sessions.filter(session => historyDateKey(session.started_at) === selectedDate) : sessions, [selectedDate, sessions])
  const selectedSession = sessions.find(session => session.id === selectedSessionId)
  if (selectedSession) return <SessionDetail session={selectedSession} onBack={() => setSelectedSessionId('')} />
  const changeMonth = (amount: number) => setMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1))
  return <main className="history-page">
    <header><button className="icon" onClick={onBack} aria-label="Voltar às fichas"><ArrowLeft /></button><div><p className="eyebrow">HISTÓRICO</p><h1>Treinos realizados</h1></div></header>
    {error && <p className="notice">{error}</p>}
    {!sessions.length && !error ? <div className="empty"><HistoryIcon /><h2>Ainda não há treinos concluídos</h2><p>Conclua seu primeiro treino para acompanhar o progresso.</p></div> : <>
      <section className="history-calendar" aria-label="Calendário de treinos"><div className="calendar-title"><button className="icon" onClick={() => changeMonth(-1)} aria-label="Mês anterior"><ChevronLeft /></button><h2>{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month)}</h2><button className="icon" onClick={() => changeMonth(1)} aria-label="Próximo mês"><ChevronRight /></button></div><div className="calendar-grid calendar-weekdays">{weekdays.map(day => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{cells.map(cell => <button key={cell.date} className={`${cell.inCurrentMonth ? '' : 'outside '}${cell.sessionIds.length ? 'has-session ' : ''}${selectedDate === cell.date ? 'selected' : ''}`} disabled={!cell.inCurrentMonth} onClick={() => setSelectedDate(current => current === cell.date ? '' : cell.date)}><span>{Number(cell.date.slice(-2))}</span>{cell.sessionIds.length > 0 && <small>{cell.sessionIds.length} treino{cell.sessionIds.length > 1 ? 's' : ''}</small>}</button>)}</div></section>
      <section className="history-list"><div className="history-list-heading"><h2>{selectedDate ? `Treinos em ${new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR')}` : 'Todas as sessões'}</h2>{selectedDate && <button className="ghost" onClick={() => setSelectedDate('')}>Limpar filtro</button>}</div>{!visibleSessions.length ? <p className="chart-empty">Nenhum treino registrado nesta data.</p> : visibleSessions.map(session => { const sets = session.workout_session_exercises.flatMap(exercise => exercise.workout_sets); return <button className="history-card" key={session.id} onClick={() => setSelectedSessionId(session.id)}><div><b>{sessionName(session)}</b><p>{new Date(session.started_at).toLocaleDateString('pt-BR')} · {session.status === 'completed' ? 'Concluído' : 'Encerrado'}</p></div><div><strong>{completedSetCount(sets)}</strong><small>séries</small></div><div><strong>{formatTrainingVolume(historyVolume(sets))}</strong><small>volume movimentado</small></div></button> })}</section>
    </>}
  </main>
}
