import { useEffect, useState } from 'react'
import { ArrowLeft, Dumbbell, Layers3, Ruler, Trophy } from 'lucide-react'
import { listWorkoutHistory } from '../workout/api'
import { dashboardSummary } from '../../lib/dashboard'
import { bmi, hasMeasurementValue } from '../../lib/measurements'
import { supabase } from '../../lib/supabase'

type Measurement = {
  id: string
  measured_at: string
  weight_kg: number | null
  height_cm: number | null
}

export function Dashboard({ onBack }: { onBack: () => void }) {
  const [sessions, setSessions] = useState<any[]>([])
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [notice, setNotice] = useState('')

  const load = async () => {
    listWorkoutHistory().then(setSessions)
    if (!supabase) return
    const { data, error } = await supabase
      .from('body_measurements')
      .select('id, measured_at, weight_kg, height_cm')
      .order('created_at', { ascending: false })

    if (error) {
      setNotice(`Não foi possível carregar as medidas: ${error.message}`)
      return
    }
    setMeasurements(data ?? [])
  }

  useEffect(() => { void load() }, [])

  const summary = dashboardSummary(sessions.map(session => ({
    status: session.status,
    sets: session.workout_session_exercises.flatMap((exercise: any) => exercise.workout_sets),
  })))
  const currentBmi = bmi(weight === '' ? null : Number(weight), height === '' ? null : Number(height))

  const saveMeasurement = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    if (!hasMeasurementValue(weight, height)) {
      setNotice('Informe ao menos peso ou altura para salvar.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setNotice('Sua sessão expirou. Entre novamente para salvar a medida.')
      return
    }

    const { data, error } = await supabase
      .from('body_measurements')
      .insert({
        owner_id: user.id,
        weight_kg: weight === '' ? null : Number(weight),
        height_cm: height === '' ? null : Number(height),
      })
      .select('id, measured_at, weight_kg, height_cm')
      .single()

    if (error || !data) {
      setNotice(error?.message ?? 'Não foi possível salvar a medida.')
      return
    }

    setMeasurements(current => [data, ...current])
    setWeight('')
    setHeight('')
    setNotice('Medida salva.')
  }

  return <main className="history-page">
    <header>
      <button className="icon" onClick={onBack}><ArrowLeft /></button>
      <div><p className="eyebrow">INÍCIO</p><h1>Seu progresso</h1></div>
    </header>

    <section className="stat-grid">
      <article><Dumbbell /><strong>{summary.completedSessions}</strong><span>treinos concluídos</span></article>
      <article><Layers3 /><strong>{summary.completedSets}</strong><span>séries realizadas</span></article>
      <article><Trophy /><strong>{summary.volume.toLocaleString('pt-BR')} kg</strong><span>volume total</span></article>
    </section>

    <section className="measurements">
      <h2><Ruler /> Medidas corporais</h2>
      <form onSubmit={saveMeasurement}>
        <label>Peso (kg)<input type="number" min="0.1" step="0.1" inputMode="decimal" value={weight} onChange={event => setWeight(event.target.value)} /></label>
        <label>Altura (cm)<input type="number" min="1" step="0.1" inputMode="decimal" value={height} onChange={event => setHeight(event.target.value)} /></label>
        <button>Salvar medida</button>
      </form>
      {currentBmi && <p>IMC atual: {currentBmi} <small>Indicador informativo, não é diagnóstico.</small></p>}
      <p className="notice" role="status">{notice}</p>
      {measurements.length > 0 && <h3>Histórico de medidas</h3>}
      {measurements.map(item => <p className="measurement" key={item.id}>
        {new Date(`${item.measured_at}T12:00:00`).toLocaleDateString('pt-BR')} · {item.weight_kg ?? '—'} kg · {item.height_cm ?? '—'} cm
      </p>)}
    </section>

    {!sessions.length && <div className="empty"><h2>Pronto para começar?</h2><p>Conclua um treino para gerar estatísticas reais.</p></div>}
  </main>
}
