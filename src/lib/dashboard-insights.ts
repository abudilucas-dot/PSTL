type InsightSet = { completed_at: string | null; load_kg: number | null; repetitions: number }
type InsightSession = { status: string; started_at: string; completed_at: string | null; plan_snapshot: { name?: string } | null; sets: InsightSet[] }
type InsightPlan = { name: string; scheduledDays: number[] }

const startOfWeek = (value: Date) => {
  const start = new Date(value)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return start
}

export function dashboardInsights(sessions: InsightSession[], plans: InsightPlan[], now = new Date()) {
  const completed = sessions.filter(session => session.status === 'completed')
  const weekStart = startOfWeek(now)
  const last = [...completed].sort((first, second) => new Date(second.started_at).getTime() - new Date(first.started_at).getTime())[0]
  const totalMinutes = completed.reduce((total, session) => {
    if (!session.completed_at) return total
    return total + Math.max(0, Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60_000))
  }, 0)
  const hour = now.getHours()
  return {
    greeting: hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite',
    weeklyWorkouts: completed.filter(session => new Date(session.started_at) >= weekStart).length,
    totalMinutes,
    suggestedPlanName: plans.find(plan => plan.scheduledDays.includes(now.getDay()))?.name ?? null,
    lastWorkoutName: last?.plan_snapshot?.name ?? null,
    lastWorkoutAt: last?.started_at ?? null,
  }
}
