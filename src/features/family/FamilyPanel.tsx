import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, Dumbbell, Gauge, Users } from 'lucide-react'
import { listFamilyProgress } from '../workout/api'
import { familySummary, type FamilyProgress } from '../../lib/family'
import { formatTrainingVolume } from '../../lib/volume'
import { listSharedProgressPhotos, type ProgressPhoto } from '../progress-photos/api'

export function FamilyPanel({ onBack }: { onBack: () => void }) {
  const [progress, setProgress] = useState<FamilyProgress[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState('')
  const [sharedPhotos, setSharedPhotos] = useState<ProgressPhoto[]>([])

  useEffect(() => {
    void listFamilyProgress()
      .then(({ members, sessions }) => {
        const summary = familySummary(members, sessions)
        setProgress(summary)
        setSelectedId(summary[0]?.id ?? '')
      })
      .catch(reason => setError(reason.message))
  }, [])

  const selected = useMemo(() => progress.find(member => member.id === selectedId) ?? progress[0], [progress, selectedId])

  useEffect(() => {
    if (!selected?.id) return
    void listSharedProgressPhotos(selected.id).then(setSharedPhotos).catch(reason => setError(reason.message))
  }, [selected?.id])

  return <main className="history-page family-page">
    <header>
      <button className="icon" onClick={onBack} aria-label="Voltar às fichas"><ArrowLeft /></button>
      <div><p className="eyebrow">FAMÍLIA</p><h1>Progresso da família</h1></div>
    </header>
    <p className="family-intro">Acompanhe a frequência de cada um. Este painel é somente para consulta: cada pessoa continua com suas fichas, treinos e edições privadas.</p>
    {error && <p className="notice">{error}</p>}
    {!progress.length && !error ? <div className="empty"><Users /><h2>Nenhum perfil da família disponível</h2><p>Entre novamente depois que os perfis forem vinculados.</p></div> : <>
      <section className="family-cards" aria-label="Membros da família">
        {progress.map(member => <button className={member.id === selected?.id ? 'family-card selected' : 'family-card'} key={member.id} onClick={() => setSelectedId(member.id)}>
          <span className="family-avatar">{member.name.slice(0, 1).toUpperCase()}</span>
          <span><b>{member.name}</b><small>{member.weekWorkouts} treino{member.weekWorkouts === 1 ? '' : 's'} nos últimos 7 dias</small></span>
        </button>)}
      </section>
      {selected && <section className="family-detail">
        <div><p className="eyebrow">VISUALIZANDO</p><h2>{selected.name}</h2></div>
        <div className="family-stats">
          <article><Dumbbell /><strong>{selected.completedWorkouts}</strong><span>treinos concluídos</span></article>
          <article><CalendarDays /><strong>{selected.weekWorkouts}</strong><span>nos últimos 7 dias</span></article>
          <article><Gauge /><strong>{formatTrainingVolume(selected.volume)}</strong><span>volume movimentado</span></article>
        </div>
        <div className="family-last-workout">
          <p><b>Último treino:</b> {selected.lastWorkoutName ?? 'Ainda não concluiu treinos'}{selected.lastWorkoutAt ? ` · ${new Date(selected.lastWorkoutAt).toLocaleDateString('pt-BR')}` : ''}</p>
          <p><b>Maior carga registrada:</b> {selected.bestLoadKg === null ? 'Sem séries com carga registradas' : `${selected.bestLoadKg.toLocaleString('pt-BR')} kg`}</p>
        </div>
        <p className="family-privacy">Sem ranking de força e sem acesso a medidas corporais: o objetivo é apoiar a consistência, preservando a privacidade de cada pessoa.</p>
        {sharedPhotos.length > 0 && <section className="shared-photos"><h3>Fotos compartilhadas</h3><div>{sharedPhotos.map(photo => <figure key={photo.id}><img src={photo.url} alt={photo.caption || `Foto de progresso de ${selected.name}`} /><figcaption>{new Date(`${photo.taken_at}T12:00:00`).toLocaleDateString('pt-BR')}{photo.caption ? ` · ${photo.caption}` : ''}</figcaption></figure>)}</div></section>}
      </section>}
    </>}
  </main>
}
