export type ExerciseSet = { completed_at: string | null; load_kg: number | null; repetitions: number }
export type ExerciseSession = { sessionId: string; startedAt: string; sets: ExerciseSet[] }
export type ExerciseProgressPoint = { sessionId: string; date: string; maxLoadKg: number; repetitions: number; volume: number }

export function exerciseProgress(sessions: ExerciseSession[]) {
  const normalized = sessions.map(session => {
    const sets = session.sets.filter(set => set.completed_at)
    const loads = sets.map(set => set.load_kg ?? 0)
    return {
      ...session,
      sets,
      point: {
        sessionId: session.sessionId,
        date: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(session.startedAt)),
        maxLoadKg: loads.length ? Math.max(...loads) : 0,
        repetitions: sets.reduce((total, set) => total + set.repetitions, 0),
        volume: sets.reduce((total, set) => total + (set.load_kg ?? 0) * set.repetitions, 0),
      },
    }
  }).filter(session => session.sets.length > 0).sort((first, second) => new Date(first.startedAt).getTime() - new Date(second.startedAt).getTime())
  const points = normalized.map(session => session.point)
  return {
    points,
    last: normalized.at(-1) ?? null,
    maxLoadKg: points.length ? Math.max(...points.map(point => point.maxLoadKg)) : 0,
    maxSessionVolume: points.length ? Math.max(...points.map(point => point.volume)) : 0,
  }
}
