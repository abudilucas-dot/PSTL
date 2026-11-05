import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarCheck, Clock3, Dumbbell, Layers3, Play, Ruler, Settings, Trophy } from 'lucide-react'
import { listWorkoutHistory } from '../workout/api'
import { listPlans } from '../plans/api'
import { dashboardSummary } from '../../lib/dashboard'
import { dashboardInsights } from '../../lib/dashboard-insights'
import { bmi, hasMeasurementValue } from '../../lib/measurements'
import { supabase } from '../../lib/supabase'
import { formatTrainingVolume } from '../../lib/volume'
import { getProfileAvatarUrl } from '../profile/api'

type Measurement = { id: string; measured_at: string; weight_kg: number | null; height_cm: number | null }
type Plan = { name: string; scheduled_days: number[]; archived_at: string | null }

export function Dashboard({ onBack, onProfile }: { onBack: () => void; onProfile: () => void }) {
  const [sessions, setSessions] = useState<any[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => {
    try {
      const history = await listWorkoutHistory()
      setSessions(history)
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      const [planData, { data: measurementData, error: measurementError }, { data: profile, error: profileError }] = await Promise.all([
        listPlans(),
        supabase.from('body_measurements').select('id, measured_at, weight_kg, height_cm').order('created_at', { ascending: false }),
        user ? supabase.from('profiles').select('display_name, avatar_path').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
      ])
      if (measurementError) throw measurementError
      if (profileError) throw profileError
      setPlans(planData as Plan[])
      setMeasurements((measurementData ?? []) as Measurement[])
      setDisplayName(profile?.display_name ?? '')
      setAvatarUrl(profile?.avatar_path ? await getProfileAvatarUrl(profile.avatar_path) : '')
    } catch (error: any) { setNotice(error.message) }
  }

  useEffect(() => { void load() }, [])
  const summary = dashboardSummary(sessions.map(session => ({ status: session.status, sets: session.workout_session_exercises.flatMap((exercise: any) => exercise.workout_sets) })))
  const insights = useMemo(() => dashboardInsights(sessions.map(session => ({ status: session.status, started_at: session.started_at, completed_at: session.completed_at, plan_snapshot: session.plan_snapshot, sets: session.workout_session_exercises.flatMap((exercise: any) => exercise.workout_sets) })), plans.filter(plan => !plan.archived_at).map(plan => ({ name: plan.name, scheduledDays: plan.scheduled_days }))), [sessions, plans])
  const currentBmi = bmi(weight === '' ? null : Number(weight), height === '' ? null : Number(height))

  const saveMeasurement = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    if (!hasMeasurementValue(weight, height)) return setNotice('Informe ao menos peso ou altura para salvar.')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setNotice('Sua sessão expirou. Entre novamente para salvar a medida.')
    const { data, error } = await supabase.from('body_measurements').insert({ owner_id: user.id, weight_kg: weight === '' ? null : Number(weight), height_cm: height === '' ? null : Number(height) }).select('id, measured_at, weight_kg, height_cm').single()
    if (error || !data) return setNotice(error?.message ?? 'Não foi possível salvar a medida.')
    setMeasurements(current => [data as Measurement, ...current]); setWeight(''); setHeight(''); setNotice('Medida salva.')
  }

  const dateLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date())
  return <main className="history-page dashboard-page">
    <header><button className="icon" onClick={onBack} aria-label="Voltar às fichas"><ArrowLeft /></button><div><p className="eyebrow">INÍCIO · {dateLabel}</p><h1>{insights.greeting}{displayName ? `, ${displayName}` : ''}!</h1><p className="dashboard-subtitle">Pronto para evoluir hoje?</p></div>{avatarUrl && <img className="dashboard-avatar" src={avatarUrl} alt={`Foto de ${displayName}`} />}<button className="icon dashboard-settings" onClick={onProfile} aria-label="Abrir perfil e configurações"><Settings /></button></header>
    <section className="dashboard-quick"><article><p className="eyebrow">TREINO SUGERIDO</p><h2>{insights.suggestedPlanName ?? 'Escolha a ficha que preferir'}</h2><p>{insights.suggestedPlanName ? 'Sugestão baseada nos dias vinculados à sua ficha.' : 'Você pode iniciar qualquer ficha a qualquer momento.'}</p><button onClick={onBack}><Play />Ver fichas</button></article><article><p className="eyebrow">ÚLTIMO TREINO</p><h2>{insights.lastWorkoutName ?? 'Ainda não há treino concluído'}</h2><p>{insights.lastWorkoutAt ? new Date(insights.lastWorkoutAt).toLocaleString('pt-BR') : 'Conclua uma sessão para criar seu histórico.'}</p></article></section>
    <section className="stat-grid dashboard-stats"><article><CalendarCheck /><strong>{insights.weeklyWorkouts}</strong><span>treinos nesta semana</span></article><article><Clock3 /><strong>{insights.totalMinutes} min</strong><span>tempo total de treino</span></article><article><Dumbbell /><strong>{summary.completedSessions}</strong><span>treinos concluídos</span></article><article><Layers3 /><strong>{summary.completedSets}</strong><span>séries realizadas</span></article><article><Trophy /><strong>{formatTrainingVolume(summary.volume)}</strong><span>volume movimentado</span></article></section>
    <section className="measurements"><h2><Ruler /> Medidas corporais</h2><form onSubmit={saveMeasurement}><label>Peso (kg)<input type="number" min="0.1" step="0.1" inputMode="decimal" value={weight} onChange={event => setWeight(event.target.value)} /></label><label>Altura (cm)<input type="number" min="1" step="0.1" inputMode="decimal" value={height} onChange={event => setHeight(event.target.value)} /></label><button>Salvar medida</button></form>{currentBmi && <p>IMC atual: {currentBmi} <small>Indicador informativo, não é diagnóstico.</small></p>}<p className="notice" role="status">{notice}</p>{measurements.length > 0 && <div className="measurement-history"><h3>Histórico de medidas</h3>{measurements.map(item => <p className="measurement" key={item.id}>{new Date(`${item.measured_at}T12:00:00`).toLocaleDateString('pt-BR')} · {item.weight_kg ?? '—'} kg · {item.height_cm ?? '—'} cm</p>)}</div>}</section>
    {!sessions.length && <div className="empty"><h2>Pronto para começar?</h2><p>Escolha uma ficha para registrar seu primeiro treino.</p></div>}
  </main>
}
