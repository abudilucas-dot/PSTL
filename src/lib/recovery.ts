export type RecoveryLevel = 'unknown' | 'rested' | 'recovering' | 'attention' | 'high'
export type RecoveryGroup = { id: string; name: string; level: RecoveryLevel; lastTrainedAt: string | null; completedSets: number }

type Session = { status: string; started_at: string; workout_session_exercises: Array<{ exercise_name: string; workout_sets: Array<{ completed_at: string | null }> }> }

const groups = [
  ['chest', 'Peitoral'], ['back', 'Costas'], ['shoulders', 'Ombros'], ['biceps', 'Bíceps'], ['triceps', 'Tríceps'], ['core', 'Abdômen'], ['quads', 'Quadríceps'], ['hamstrings', 'Posteriores'], ['glutes', 'Glúteos'], ['calves', 'Panturrilhas'],
] as const

function groupsForExercise(name: string): Array<(typeof groups)[number][0]> {
  const value = name.toLocaleLowerCase('pt-BR')
  if (/abdominal|abdômen/.test(value)) return ['core']
  if (/tríceps/.test(value)) return ['triceps']
  if (/rosca|bíceps/.test(value)) return ['biceps']
  if (/voador invertido|crucifixo inverso|elevação lateral|elevação frontal|desenvolvimento/.test(value)) return ['shoulders']
  if (/remada|puxador|pulldown|serrote|terra/.test(value)) return ['back']
  if (/panturrilha|elevação em pé/.test(value)) return ['calves']
  if (/abdutora|elevação pélvica/.test(value)) return ['glutes', 'hamstrings']
  if (/flexora|stiff/.test(value)) return ['hamstrings']
  if (/agachamento|pêndulo|leg press|extensora|afundo|adutora/.test(value)) return ['quads']
  if (/chest press|supino|crossover|crucifixo|voador/.test(value)) return ['chest']
  return []
}

const levelFor = (hours: number, sets: number): RecoveryLevel => {
  const base = hours < 24 ? 4 : hours < 48 ? 3 : hours < 72 ? 2 : 1
  const score = Math.min(4, base + (sets >= 8 && base < 4 ? 1 : 0))
  return (['unknown', 'rested', 'recovering', 'attention', 'high'] as const)[score]
}

export function recoverySummary(sessions: Session[], now = new Date()): RecoveryGroup[] {
  const state = new Map(groups.map(([id]) => [id, { lastTrainedAt: null as string | null, completedSets: 0 }]))
  sessions.filter(session => session.status === 'completed').forEach(session => session.workout_session_exercises.forEach(exercise => {
    const completedSets = exercise.workout_sets.filter(set => set.completed_at).length
    groupsForExercise(exercise.exercise_name).forEach(id => {
      const current = state.get(id)!
      current.completedSets += completedSets
      if (!current.lastTrainedAt || new Date(session.started_at) > new Date(current.lastTrainedAt)) current.lastTrainedAt = session.started_at
    })
  }))
  return groups.map(([id, name]) => {
    const current = state.get(id)!
    const hours = current.lastTrainedAt ? (now.getTime() - new Date(current.lastTrainedAt).getTime()) / 3_600_000 : 0
    return { id, name, level: current.lastTrainedAt ? levelFor(hours, current.completedSets) : 'unknown', ...current }
  })
}
