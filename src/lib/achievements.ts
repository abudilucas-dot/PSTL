type AchievementSet = { completed_at: string | null; load_kg: number | null }
export type AchievementSession = { status: string; startedAt: string; sets: AchievementSet[] }

export const achievementLabels: Record<string, { title: string; description: string }> = {
  'first-workout': { title: 'Primeiro treino', description: 'Concluiu a primeira sessão.' },
  'five-workouts': { title: '5 treinos concluídos', description: 'Manteve o registro em dia.' },
  'ten-workouts': { title: '10 treinos concluídos', description: 'A consistência está crescendo.' },
  'weekly-frequency': { title: 'Meta semanal', description: 'Concluiu 3 treinos nos últimos 7 dias.' },
  'new-personal-record': { title: 'Novo recorde pessoal', description: 'A última sessão superou sua maior carga anterior.' },
}

export function earnedAchievementIds(sessions: AchievementSession[], now = new Date()) {
  const completed = sessions.filter(session => session.status === 'completed').sort((first, second) => new Date(first.startedAt).getTime() - new Date(second.startedAt).getTime())
  const ids: string[] = []
  if (completed.length >= 1) ids.push('first-workout')
  if (completed.length >= 5) ids.push('five-workouts')
  if (completed.length >= 10) ids.push('ten-workouts')
  if (completed.filter(session => new Date(session.startedAt).getTime() >= now.getTime() - 7 * 24 * 60 * 60 * 1000).length >= 3) ids.push('weekly-frequency')
  const last = completed.at(-1)
  const previousLoads = completed.slice(0, -1).flatMap(session => session.sets.filter(set => set.completed_at).map(set => set.load_kg ?? 0))
  const latestLoads = last?.sets.filter(set => set.completed_at).map(set => set.load_kg ?? 0) ?? []
  if (previousLoads.length && latestLoads.length && Math.max(...latestLoads) > Math.max(...previousLoads)) ids.push('new-personal-record')
  return ids
}
