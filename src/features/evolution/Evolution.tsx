import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BarChart3, LineChart as LineChartIcon, Ruler } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { listWorkoutHistory } from '../workout/api'
import { bodyWeightPoints, measurementSummary, weeklyTrainingPoints } from '../../lib/evolution'
import { bmi, hasMeasurementValue } from '../../lib/measurements'
import { supabase } from '../../lib/supabase'
import { formatTrainingVolume, formatVolumeTooltip } from '../../lib/volume'

type Measurement = {
  id: string
  measured_at: string
  weight_kg: number | null
  height_cm: number | null
  arm_cm: number | null
  forearm_cm: number | null
  chest_cm: number | null
  waist_cm: number | null
  hip_cm: number | null
  thigh_cm: number | null
  calf_cm: number | null
  body_fat_percent: number | null
  custom_measurements: Record<string, number>
}

type MeasurementForm = Record<'weight_kg' | 'height_cm' | 'arm_cm' | 'forearm_cm' | 'chest_cm' | 'waist_cm' | 'hip_cm' | 'thigh_cm' | 'calf_cm' | 'body_fat_percent', string>

const blank = (): MeasurementForm => ({ weight_kg: '', height_cm: '', arm_cm: '', forearm_cm: '', chest_cm: '', waist_cm: '', hip_cm: '', thigh_cm: '', calf_cm: '', body_fat_percent: '' })
const fields: Array<{ key: keyof MeasurementForm; label: string; unit: string }> = [
  { key: 'weight_kg', label: 'Peso', unit: 'kg' }, { key: 'height_cm', label: 'Altura', unit: 'cm' }, { key: 'arm_cm', label: 'Braço', unit: 'cm' }, { key: 'forearm_cm', label: 'Antebraço', unit: 'cm' }, { key: 'chest_cm', label: 'Peitoral', unit: 'cm' }, { key: 'waist_cm', label: 'Cintura', unit: 'cm' }, { key: 'hip_cm', label: 'Quadril', unit: 'cm' }, { key: 'thigh_cm', label: 'Coxa', unit: 'cm' }, { key: 'calf_cm', label: 'Panturrilha', unit: 'cm' }, { key: 'body_fat_percent', label: 'Gordura corporal', unit: '%' },
]
const numericOrNull = (value: string) => value === '' ? null : Number(value)

export function Evolution({ onBack }: { onBack: () => void }) {
  const [sessions, setSessions] = useState<any[]>([])
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [form, setForm] = useState<MeasurementForm>(blank())
  const [otherName, setOtherName] = useState('')
  const [otherValue, setOtherValue] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const history = await listWorkoutHistory()
      setSessions(history)
      if (!supabase) return
      const { data, error } = await supabase.from('body_measurements').select('id, measured_at, weight_kg, height_cm, arm_cm, forearm_cm, chest_cm, waist_cm, hip_cm, thigh_cm, calf_cm, body_fat_percent, custom_measurements').order('created_at', { ascending: false })
      if (error) throw error
      setMeasurements((data ?? []) as Measurement[])
    } catch (error: any) {
      setNotice(error.message)
    }
  }

  useEffect(() => { void load() }, [])

  const weeklyPoints = useMemo(() => weeklyTrainingPoints(sessions), [sessions])
  const weightPoints = useMemo(() => bodyWeightPoints(measurements), [measurements])
  const currentBmi = bmi(numericOrNull(form.weight_kg), numericOrNull(form.height_cm))
  const totals = weeklyPoints.reduce((total, point) => ({ sessions: total.sessions + point.sessions, sets: total.sets + point.sets, volume: total.volume + point.volume }), { sessions: 0, sets: 0, volume: 0 })

  const saveMeasurement = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    if (!hasMeasurementValue(form.weight_kg, form.height_cm) && !fields.some(field => form[field.key] !== '') && !otherName.trim()) {
      setNotice('Informe pelo menos uma medida para salvar.')
      return
    }
    if (otherName.trim() && (!otherValue || Number(otherValue) <= 0)) {
      setNotice('Informe um valor válido para a medida extra.')
      return
    }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setNotice('Sua sessão expirou. Entre novamente.')
      const customMeasurements = otherName.trim() ? { [otherName.trim()]: Number(otherValue) } : {}
      const values = Object.fromEntries(fields.map(field => [field.key, numericOrNull(form[field.key])]))
      const { data, error } = await supabase.from('body_measurements').insert({ owner_id: user.id, ...values, custom_measurements: customMeasurements }).select('id, measured_at, weight_kg, height_cm, arm_cm, forearm_cm, chest_cm, waist_cm, hip_cm, thigh_cm, calf_cm, body_fat_percent, custom_measurements').single()
      if (error || !data) return setNotice(error?.message ?? 'Não foi possível salvar a medida.')
      setMeasurements(current => [data as Measurement, ...current])
      setForm(blank())
      setOtherName('')
      setOtherValue('')
      setNotice('Medidas salvas.')
    } finally {
      setSaving(false)
    }
  }

  return <main className="history-page evolution-page">
    <header><button className="icon" onClick={onBack}><ArrowLeft /></button><div><p className="eyebrow">EVOLUÇÃO</p><h1>Seu progresso</h1></div></header>
    <section className="stat-grid evolution-stats">
      <article><BarChart3 /><strong>{totals.sessions}</strong><span>treinos concluídos</span></article>
      <article><Ruler /><strong>{totals.sets}</strong><span>séries realizadas</span></article>
      <article><LineChartIcon /><strong>{formatTrainingVolume(totals.volume)}</strong><span>volume movimentado</span></article>
    </section>
    <p className="volume-explanation">Volume movimentado é a soma de carga × repetições em cada série concluída. Não é um único levantamento.</p>
    <section className="chart-grid">
      <article className="chart-card"><h2>Volume semanal</h2>{weeklyPoints.length ? <ResponsiveContainer width="100%" height={240}><BarChart data={weeklyPoints}><CartesianGrid stroke="#3b5142" vertical={false} /><XAxis dataKey="week" stroke="#a9b8ae" /><YAxis stroke="#a9b8ae" tickFormatter={formatTrainingVolume} /><Tooltip contentStyle={{ background: '#19261e', border: '1px solid #3b5142' }} formatter={value => formatVolumeTooltip(Number(value))} /><Bar dataKey="volume" name="Volume" fill="#7ddc99" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="chart-empty">Conclua treinos para visualizar seu volume semanal.</p>}</article>
      <article className="chart-card"><h2>Peso corporal</h2>{weightPoints.length ? <ResponsiveContainer width="100%" height={240}><LineChart data={weightPoints}><CartesianGrid stroke="#3b5142" vertical={false} /><XAxis dataKey="date" stroke="#a9b8ae" /><YAxis stroke="#a9b8ae" domain={['dataMin - 1', 'dataMax + 1']} /><Tooltip contentStyle={{ background: '#19261e', border: '1px solid #3b5142' }} /><Line type="monotone" dataKey="weight" name="Peso (kg)" stroke="#a8e6b7" strokeWidth={3} dot={{ fill: '#a8e6b7' }} /></LineChart></ResponsiveContainer> : <p className="chart-empty">Salve seu peso para acompanhar a evolução corporal.</p>}</article>
    </section>
    <section className="measurements full-measurements">
      <h2><Ruler /> Registrar medidas</h2>
      <form onSubmit={saveMeasurement}>{fields.map(field => <label key={field.key}>{field.label} ({field.unit})<input type="number" min="0.1" step="0.1" inputMode="decimal" value={form[field.key]} onChange={event => setForm(current => ({ ...current, [field.key]: event.target.value }))} /></label>)}<label>Outra medida<input placeholder="Nome" value={otherName} onChange={event => setOtherName(event.target.value)} /></label><label>Valor extra<input type="number" min="0.1" step="0.1" inputMode="decimal" value={otherValue} onChange={event => setOtherValue(event.target.value)} /></label><button disabled={saving}>{saving ? 'Salvando…' : 'Salvar medidas'}</button></form>
      {currentBmi && <p>IMC atual: {currentBmi} <small>Indicador informativo, não é diagnóstico.</small></p>}
      <p className="notice" role="status">{notice}</p>
      {measurements.length > 0 && <div className="measurement-history"><h3>Histórico corporal</h3>{measurements.map(measurement => <p className="measurement" key={measurement.id}>{new Date(`${measurement.measured_at}T12:00:00`).toLocaleDateString('pt-BR')} · {measurementSummary(measurement) || 'Sem valores preenchidos'}</p>)}</div>}
    </section>
  </main>
}
