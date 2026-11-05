import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowLeft, Save } from 'lucide-react'
import { listWorkoutHistory } from '../workout/api'
import { listRecoveryCheckins, saveRecoveryCheckin, type RecoveryCheckin } from './api'
import { recoverySummary, type RecoveryGroup, type RecoveryLevel } from '../../lib/recovery'

const levels: Record<RecoveryLevel, string> = { unknown: 'Dados insuficientes', rested: 'Menor fadiga estimada', recovering: 'Recuperação em andamento', attention: 'Atenção', high: 'Maior fadiga estimada' }
const colors: Record<RecoveryLevel, string> = { unknown: '#3b5142', rested: '#44d17a', recovering: '#58a6ff', attention: '#f2c94c', high: '#f87171' }

function BodyMap({ groups, selected, onSelect, back }: { groups: RecoveryGroup[]; selected: string; onSelect: (id: string) => void; back: boolean }) {
  const status = (id: string) => groups.find(group => group.id === id)?.level ?? 'unknown'
  const muscle = (id: string, d: string) => <path key={id} d={d} className={`recovery-muscle ${status(id)} ${selected === id ? 'selected' : ''}`} onClick={() => onSelect(id)} role="button" tabIndex={0} aria-label={`Selecionar ${groups.find(group => group.id === id)?.name ?? id}`} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onSelect(id) }} />
  return <svg className="recovery-body" viewBox="0 0 180 330" role="img" aria-label={back ? 'Mapa muscular posterior' : 'Mapa muscular anterior'}><circle cx="90" cy="28" r="18" className="recovery-outline" />{back ? <>{muscle('shoulders', 'M47 61 Q61 48 75 58 L105 58 Q119 48 133 61 L125 84 L55 84Z')}{muscle('back', 'M62 85 Q90 73 118 85 L112 154 L68 154Z')}{muscle('triceps', 'M48 78 L61 86 L50 144 L36 136Z')}{muscle('triceps', 'M132 78 L119 86 L130 144 L144 136Z')}{muscle('glutes', 'M65 158 Q90 145 115 158 L118 186 L62 186Z')}{muscle('hamstrings', 'M63 188 L84 188 L80 258 L58 258Z')}{muscle('hamstrings', 'M96 188 L117 188 L122 258 L100 258Z')}</> : <>{muscle('shoulders', 'M47 61 Q61 48 75 58 L105 58 Q119 48 133 61 L125 84 L55 84Z')}{muscle('chest', 'M62 85 L88 83 L88 119 L64 114Z')}{muscle('chest', 'M92 83 L118 85 L116 114 L92 119Z')}{muscle('biceps', 'M48 80 L62 88 L51 144 L37 136Z')}{muscle('biceps', 'M132 80 L118 88 L129 144 L143 136Z')}{muscle('core', 'M70 120 L110 120 L108 170 L72 170Z')}{muscle('quads', 'M63 174 L85 174 L81 258 L58 258Z')}{muscle('quads', 'M95 174 L117 174 L122 258 L99 258Z')}</>}{muscle('calves', 'M61 260 L79 260 L75 307 L57 307Z')}{muscle('calves', 'M101 260 L119 260 L123 307 L105 307Z')}<path d="M75 46 L67 60 M105 46 L113 60 M70 170 L58 260 M110 170 L122 260" className="recovery-outline" /></svg>
}

export function Recovery({ onBack }: { onBack: () => void }) {
  const [groups, setGroups] = useState<RecoveryGroup[]>([])
  const [checkins, setCheckins] = useState<RecoveryCheckin[]>([])
  const [selected, setSelected] = useState('chest')
  const [back, setBack] = useState(false)
  const [soreness, setSoreness] = useState(3)
  const [fatigue, setFatigue] = useState(3)
  const [quality, setQuality] = useState(3)
  const [notes, setNotes] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const load = async () => { try { const [sessions, saved] = await Promise.all([listWorkoutHistory(), listRecoveryCheckins()]); setGroups(recoverySummary(sessions as any[])); setCheckins(saved) } catch (error: any) { setNotice(error.message) } }
  useEffect(() => { void load() }, [])
  const current = useMemo(() => groups.find(group => group.id === selected), [groups, selected])
  const checkinFields: Array<{ label: string; value: number; setValue: (next: number) => void }> = [{ label: 'Dor muscular', value: soreness, setValue: setSoreness }, { label: 'Fadiga', value: fatigue, setValue: setFatigue }, { label: 'Qualidade da recuperação', value: quality, setValue: setQuality }]
  const save = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); try { const saved = await saveRecoveryCheckin({ soreness, fatigue, recovery_quality: quality, notes: notes.trim() }); setCheckins(current => [saved, ...current]); setNotes(''); setNotice('Check-in de recuperação salvo.') } catch (error: any) { setNotice(error.message) } finally { setSaving(false) } }
  return <main className="history-page recovery-page">
    <header><button className="icon" onClick={onBack} aria-label="Voltar às fichas"><ArrowLeft /></button><div><p className="eyebrow">RECUPERAÇÃO</p><h1>Como seu corpo está hoje?</h1></div></header>
    <p className="recovery-disclaimer">As cores são estimativas baseadas no tempo desde os treinos e nas séries registradas. Elas não diagnosticam recuperação muscular nem determinam se você deve treinar.</p>
    <section className="recovery-layout"><article className="recovery-map-card"><div className="recovery-view-toggle"><button className={!back ? 'selected' : 'ghost'} onClick={() => setBack(false)}>Anterior</button><button className={back ? 'selected' : 'ghost'} onClick={() => setBack(true)}>Posterior</button></div><BodyMap groups={groups} selected={selected} onSelect={setSelected} back={back} /><div className="recovery-legend">{(Object.keys(levels) as RecoveryLevel[]).map(level => <span key={level}><i style={{ background: colors[level] }} />{levels[level]}</span>)}</div></article><article className="recovery-focus"><p className="eyebrow">GRUPO SELECIONADO</p><h2>{current?.name ?? 'Carregando…'}</h2><strong className={`recovery-badge ${current?.level ?? 'unknown'}`}>{levels[current?.level ?? 'unknown']}</strong><p>{current?.lastTrainedAt ? `Último registro: ${new Date(current.lastTrainedAt).toLocaleString('pt-BR')}` : 'Nenhum exercício identificado neste grupo ainda.'}</p><p>{current?.completedSets ? `${current.completedSets} séries concluídas consideradas nos registros.` : 'Registre séries concluídas para gerar uma estimativa.'}</p></article></section>
    <section className="recovery-groups">{groups.map(group => <button className={selected === group.id ? `selected ${group.level}` : group.level} key={group.id} onClick={() => setSelected(group.id)}><i style={{ background: colors[group.level] }} /><span>{group.name}</span><small>{levels[group.level]}</small></button>)}</section>
    <section className="measurements recovery-checkin"><h2><Activity /> Check-in pessoal</h2><p>Registre sua percepção; esses dados ficam privados para você.</p><form onSubmit={save}>{checkinFields.map(field => <label key={field.label}>{field.label}: <b>{field.value}/5</b><input type="range" min="1" max="5" value={field.value} onChange={event => field.setValue(Number(event.target.value))} /></label>)}<label>Observação opcional<textarea maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Ex.: pernas cansadas após o treino de ontem" /></label><button disabled={saving}>{saving ? 'Salvando…' : <><Save />Salvar check-in</>}</button></form><p className="notice" role="status">{notice}</p>{checkins.length > 0 && <div className="recovery-history"><h3>Check-ins recentes</h3>{checkins.map(item => <p key={item.id}>{new Date(item.recorded_at).toLocaleString('pt-BR')} · dor {item.soreness}/5 · fadiga {item.fatigue}/5 · recuperação {item.recovery_quality}/5{item.notes ? ` · ${item.notes}` : ''}</p>)}</div>}</section>
  </main>
}
