import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Archive, BarChart3, Copy, Dumbbell, GripVertical, Home, Plus, Save, Settings, Trash2, Users } from 'lucide-react'
import { supabase } from './lib/supabase'
import type { PlanExerciseInput } from './lib/plan'
import { archiveWorkoutPlan, createExercise, duplicateWorkoutPlan, listExercises, listPlans, saveWorkoutPlan, seedInitialPlans, softDeleteWorkoutPlan, type WorkoutPlanInput } from './features/plans/api'
import { getActiveWorkout, startWorkout, type ActiveSession } from './features/workout/api'
import { WorkoutRunner } from './features/workout/WorkoutRunner'
import { shouldShowWorkout } from './lib/workout-navigation'
import { workoutAction } from './lib/workout-start'
import { History } from './features/history/History'
import { Dashboard } from './features/dashboard/Dashboard'
import { mobileNavigation, type MobileDestination } from './lib/mobile-navigation'
import { defaultWorkoutPreferences, type WorkoutPreferences } from './lib/workout-preferences'
import { getOwnWorkoutPreferences } from './features/profile/api'
import { passwordResetNotice } from './lib/password-reset'

const Evolution = lazy(() => import('./features/evolution/Evolution').then(module => ({ default: module.Evolution })))
const ExerciseLibrary = lazy(() => import('./features/exercises/ExerciseLibrary').then(module => ({ default: module.ExerciseLibrary })))
const FamilyPanel = lazy(() => import('./features/family/FamilyPanel').then(module => ({ default: module.FamilyPanel })))
const Recovery = lazy(() => import('./features/recovery/Recovery').then(module => ({ default: module.Recovery })))
const Profile = lazy(() => import('./features/profile/Profile').then(module => ({ default: module.Profile })))

type Exercise = { id: string; name: string; muscle_group: string }
type Plan = WorkoutPlanInput & { id: string; archived_at?: string | null }
type Screen = 'plans' | 'history' | 'dashboard' | 'evolution' | 'exercises' | 'family' | 'recovery' | 'profile'
const empty = (): WorkoutPlanInput => ({ name: 'Nova ficha', description: '', scheduledDays: [], exercises: [] })
const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function Row({ item, exercises, onChange, onRemove }: { item: PlanExerciseInput; exercises: Exercise[]; onChange: (next: PlanExerciseInput) => void; onRemove: () => void }) {
  const sortable = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }
  return <article ref={sortable.setNodeRef} style={style} className="exercise-row">
    <button className="drag" aria-label="Arrastar exercício" {...sortable.attributes} {...sortable.listeners}><GripVertical /></button>
    <select value={item.exerciseId} onChange={event => onChange({ ...item, exerciseId: event.target.value })}>{exercises.map(exercise => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select>
    <label>Séries<input type="number" min="1" value={item.sets} onChange={event => onChange({ ...item, sets: Number(event.target.value) })} /></label>
    <label>Reps<input value={item.repetitions} onChange={event => onChange({ ...item, repetitions: event.target.value })} /></label>
    <label>Carga kg<input type="number" min="0" step="0.5" value={item.plannedLoadKg ?? ''} onChange={event => onChange({ ...item, plannedLoadKg: event.target.value === '' ? null : Number(event.target.value) })} /></label>
    <label>Descanso s<input type="number" min="0" value={item.restSeconds} onChange={event => onChange({ ...item, restSeconds: Number(event.target.value) })} /></label>
    <input aria-label="Observações" placeholder="Observações" value={item.notes} onChange={event => onChange({ ...item, notes: event.target.value })} />
    <button className="icon danger" onClick={onRemove} aria-label="Remover exercício"><Trash2 /></button>
  </article>
}

function MobileNav({ screen, onNavigate }: { screen: Screen; onNavigate: (destination: MobileDestination) => void }) {
  const Icon = ({ destination }: { destination: MobileDestination }) => destination === 'dashboard' ? <Home /> : destination === 'plans' || destination === 'exercises' ? <Dumbbell /> : destination === 'evolution' ? <BarChart3 /> : <Users />
  return <nav className="mobile-nav" aria-label="Navegação principal">{mobileNavigation.map(item => <button className={screen === item.id ? 'selected' : ''} key={item.id} onClick={() => onNavigate(item.id)}><Icon destination={item.id} /><span>{item.label}</span></button>)}</nav>
}

export default function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signedIn, setSignedIn] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [library, setLibrary] = useState<Exercise[]>([])
  const [draft, setDraft] = useState<WorkoutPlanInput>(empty())
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [starting, setStarting] = useState(false)
  const [active, setActive] = useState<ActiveSession | null>(null)
  const [runnerDismissed, setRunnerDismissed] = useState(false)
  const [screen, setScreen] = useState<Screen>('plans')
  const [workoutPreferences, setWorkoutPreferences] = useState<WorkoutPreferences>(defaultWorkoutPreferences)
  const [recoveryMode, setRecoveryMode] = useState(false)

  const refresh = async () => {
    let loadedPlans = await listPlans()
    if (!loadedPlans.length) {
      await seedInitialPlans()
      loadedPlans = await listPlans()
    }
    const [exercises, preferences] = await Promise.all([listExercises(), getOwnWorkoutPreferences()])
    setPlans(loadedPlans.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      scheduledDays: plan.scheduled_days,
      archived_at: plan.archived_at,
      exercises: plan.workout_plan_exercises.sort((a: any, b: any) => a.position - b.position).map((item: any) => ({
        id: item.id,
        exerciseId: item.exercise_id,
        position: item.position,
        sets: item.sets,
        repetitions: item.repetitions,
        plannedLoadKg: item.planned_load_kg,
        restSeconds: item.rest_seconds,
        notes: item.notes,
      })),
    })))
    setLibrary(exercises)
    setWorkoutPreferences(preferences)
    setActive(await getActiveWorkout())
  }

  useEffect(() => {
    const client = supabase
    if (!client) return
    client.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session))
      if (data.session) void refresh()
    })
    const { data } = client.auth.onAuthStateChange((event, session) => {
      setSignedIn(Boolean(session))
      if (session) void refresh()
      if (event === 'PASSWORD_RECOVERY' && session) { setRecoveryMode(true); setScreen('profile') }
      if (!session) setRecoveryMode(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const selected = useMemo(() => plans.find(plan => plan.id === draft.id), [plans, draft.id])
  const action = workoutAction(Boolean(active), starting)

  const openWorkout = async () => {
    if (active) {
      setRunnerDismissed(false)
      return
    }
    setStarting(true)
    try {
      const started = await startWorkout(draft as Plan, new Map(library.map(exercise => [exercise.id, exercise.name])))
      setActive(started)
      setRunnerDismissed(false)
    } catch (error: any) {
      setNotice(error.message)
    } finally {
      setStarting(false)
    }
  }

  if (!supabase) return <main className="center"><h1>PSTL</h1><p>Configure o Supabase em <code>.env.local</code> para iniciar.</p></main>
  if (!signedIn) return <main className="center"><h1>PSTL</h1><p>Acesso familiar protegido</p><form onSubmit={async event => { event.preventDefault(); setBusy(true); const { error } = await supabase!.auth.signInWithPassword({ email, password }); setBusy(false); setNotice(error?.message ?? '') }}><input placeholder="E-mail" type="email" value={email} onChange={event => setEmail(event.target.value)} required /><input placeholder="Senha" type="password" value={password} onChange={event => setPassword(event.target.value)} required /><button disabled={busy}>Entrar</button><button type="button" className="login-reset" disabled={busy} onClick={async () => { const message = passwordResetNotice(email); if (!email.trim()) return setNotice(message); setBusy(true); const { error } = await supabase!.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin }); setBusy(false); setNotice(error?.message ?? message) }}>Redefinir senha</button><small className="login-help">Esqueceu a senha? Informe seu e-mail e toque em “Redefinir senha”.</small></form><small className="notice login-notice" role="status">{notice}</small></main>
  if (shouldShowWorkout(Boolean(active), runnerDismissed)) return <WorkoutRunner session={active!} preferences={workoutPreferences} onClose={() => setRunnerDismissed(true)} onFinished={() => { setActive(null); setRunnerDismissed(true); void refresh() }} onCancelled={() => { setActive(null); setRunnerDismissed(true); void refresh() }} />
  const mobileNav = <MobileNav screen={screen} onNavigate={destination => setScreen(destination)} />
  if (screen === 'history') return <><History onBack={() => setScreen('plans')} />{mobileNav}</>
  if (screen === 'dashboard') return <><Dashboard onBack={() => setScreen('plans')} onProfile={() => setScreen('profile')} />{mobileNav}</>
  if (screen === 'evolution') return <><Suspense fallback={<main className="center"><p>Carregando evolução…</p></main>}><Evolution onBack={() => setScreen('plans')} /></Suspense>{mobileNav}</>
  if (screen === 'exercises') return <><Suspense fallback={<main className="center"><p>Carregando exercícios…</p></main>}><ExerciseLibrary onBack={() => setScreen('plans')} /></Suspense>{mobileNav}</>
  if (screen === 'family') return <><Suspense fallback={<main className="center"><p>Carregando família…</p></main>}><FamilyPanel onBack={() => setScreen('plans')} /></Suspense>{mobileNav}</>
  if (screen === 'recovery') return <><Suspense fallback={<main className="center"><p>Carregando recuperação…</p></main>}><Recovery onBack={() => setScreen('plans')} /></Suspense>{mobileNav}</>
  if (screen === 'profile') return <><Suspense fallback={<main className="center"><p>Carregando perfil…</p></main>}><Profile onBack={() => setScreen('plans')} onSignedOut={() => { setSignedIn(false); setScreen('plans') }} onPreferencesChanged={setWorkoutPreferences} recoveryMode={recoveryMode} onPasswordChanged={() => setRecoveryMode(false)} /></Suspense>{mobileNav}</>

  const setItems = (exercises: PlanExerciseInput[]) => setDraft({ ...draft, exercises })
  const dragEnd = (event: DragEndEvent) => {
    if (event.over && event.active.id !== event.over.id) {
      const oldIndex = draft.exercises.findIndex(item => item.id === event.active.id)
      const newIndex = draft.exercises.findIndex(item => item.id === event.over?.id)
      setItems(arrayMove(draft.exercises, oldIndex, newIndex))
    }
  }
  const add = () => {
    const choice = library[0]
    if (!choice) return setNotice('Crie primeiro um exercício na biblioteca.')
    setItems([...draft.exercises, { id: crypto.randomUUID(), exerciseId: choice.id, position: draft.exercises.length, sets: 4, repetitions: '10–12', plannedLoadKg: null, restSeconds: workoutPreferences.defaultRestSeconds, notes: '' }])
  }

  return <><main className="app">
    <aside>
      <h1>PSTL</h1>
      <button onClick={() => { setDraft(empty()); setNotice('') }}><Plus /> Nova ficha</button>
      {active && <button className="ghost" onClick={() => setRunnerDismissed(false)}>Treino iniciado</button>}
      <button className="ghost" onClick={() => setScreen('dashboard')}>Início</button>
      <button className="ghost" onClick={() => setScreen('history')}>Histórico</button>
      <button className="ghost" onClick={() => setScreen('evolution')}>Evolução</button>
      <button className="ghost" onClick={() => setScreen('exercises')}>Exercícios</button>
      <button className="ghost" onClick={() => setScreen('family')}>Família</button>
      <button className="ghost" onClick={() => setScreen('recovery')}>Recuperação</button>
      <button className="ghost" onClick={() => setScreen('profile')}><Settings />Perfil</button>
      <nav>{plans.filter(plan => !plan.archived_at).map(plan => <button className={selected?.id === plan.id ? 'selected' : ''} key={plan.id} onClick={() => setDraft(plan)}>{plan.name}<span>{plan.exercises.length}</span></button>)}</nav>
      <button className="ghost" onClick={() => supabase!.auth.signOut()}>Sair</button>
    </aside>
    <section className="editor">
      <header>
        <div>
          <p className="eyebrow">MINHA FICHA</p>
          <input className="title" value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} />
          <textarea placeholder="Descrição do treino" value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} />
        </div>
        <div className="actions">
          {draft.id && draft.exercises.length > 0 && <button disabled={action === 'starting'} onClick={openWorkout}>{action === 'resume' ? 'Treino iniciado' : action === 'starting' ? 'Iniciando treino…' : 'Começar treino'}</button>}
          <button onClick={async () => { setBusy(true); try { const saved = await saveWorkoutPlan(draft); setDraft({ ...draft, id: saved.id }); await refresh(); setNotice('Alterações salvas no Supabase.') } catch (error: any) { setNotice(error.message) } finally { setBusy(false) } }} disabled={busy}><Save />Salvar alterações</button>
          {draft.id && <>
            <button className="icon" aria-label="Duplicar ficha" onClick={async () => { await duplicateWorkoutPlan(draft); await refresh(); setNotice('Ficha duplicada.') }}><Copy /></button>
            <button className="icon" aria-label="Arquivar ficha" onClick={async () => { await archiveWorkoutPlan(draft.id!, true); await refresh(); setNotice('Ficha duplicada.') }}><Archive /></button>
            <button className="icon danger" aria-label="Excluir ficha" onClick={async () => { if (confirm('Excluir esta ficha? O histórico de sessões será preservado.')) { await softDeleteWorkoutPlan(draft.id!); await refresh(); setDraft(empty()) } }}><Trash2 /></button>
          </>}
        </div>
      </header>
      <p className="notice" role="status">{notice}</p>
      <div className="days">{days.map((day, index) => <button className={draft.scheduledDays.includes(index) ? 'on' : ''} key={day} onClick={() => setDraft({ ...draft, scheduledDays: draft.scheduledDays.includes(index) ? draft.scheduledDays.filter(item => item !== index) : [...draft.scheduledDays, index] })}>{day}</button>)}</div>
      <div className="library">
        <button onClick={add}><Plus />Adicionar exercício</button>
        <button className="ghost" onClick={async () => { const name = prompt('Nome do exercício personalizado'); if (name) { const muscle = prompt('Grupo muscular') ?? ''; await createExercise(name, muscle); await refresh(); setNotice('Exercício adicionado à sua biblioteca.') } }}>Criar exercício personalizado</button>
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={dragEnd}>
        <SortableContext items={draft.exercises.map(item => item.id)} strategy={verticalListSortingStrategy}>
          {draft.exercises.map(item => <Row key={item.id} item={item} exercises={library} onChange={next => setItems(draft.exercises.map(current => current.id === item.id ? next : current))} onRemove={() => setItems(draft.exercises.filter(current => current.id !== item.id))} />)}
        </SortableContext>
      </DndContext>
    </section>
  </main>{mobileNav}</>
}
