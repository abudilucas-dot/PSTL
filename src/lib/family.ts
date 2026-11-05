export type FamilyMember = { id: string; display_name: string; avatar_path?: string | null }

type WorkoutSet = { completed_at: string | null; load_kg: number | null; repetitions: number }
export type FamilySession = {
  owner_id: string
  status: string
  started_at: string
  plan_snapshot: { name?: string } | null
  workout_session_exercises: Array<{ workout_sets: WorkoutSet[] }>
}

export type FamilyProgress = {
  id: string
  name: string
  avatarPath: string | null
  completedWorkouts: number
  weekWorkouts: number
  volume: number
  bestLoadKg: number | null
  lastWorkoutName: string | null
  lastWorkoutAt: string | null
}

const isInLastSevenDays = (date: string, now: Date) => new Date(date).getTime() >= now.getTime() - 7 * 24 * 60 * 60 * 1000

export function familySummary(members: FamilyMember[], sessions: FamilySession[], now = new Date()): FamilyProgress[] {
  return members.map(member => {
    const completed = sessions
      .filter(session => session.owner_id === member.id && session.status === 'completed')
      .sort((first, second) => new Date(second.started_at).getTime() - new Date(first.started_at).getTime())
    const sets = completed.flatMap(session => session.workout_session_exercises.flatMap(exercise => exercise.workout_sets)).filter(set => set.completed_at)
    const loads = sets.map(set => set.load_kg).filter((load): load is number => load !== null)
    const last = completed[0]
    return {
      id: member.id,
      name: member.display_name,
      avatarPath: member.avatar_path ?? null,
      completedWorkouts: completed.length,
      weekWorkouts: completed.filter(session => isInLastSevenDays(session.started_at, now)).length,
      volume: sets.reduce((total, set) => total + (set.load_kg ?? 0) * set.repetitions, 0),
      bestLoadKg: loads.length ? Math.max(...loads) : null,
      lastWorkoutName: last?.plan_snapshot?.name ?? null,
      lastWorkoutAt: last?.started_at ?? null,
    }
  })
}
