import { expect, it } from 'vitest'
import { dashboardInsights } from './dashboard-insights'

it('derives dashboard suggestions and weekly information only from saved plans and sessions', () => {
  const result = dashboardInsights([
    { status: 'completed', started_at: '2026-11-02T10:00:00Z', completed_at: '2026-11-02T11:15:00Z', plan_snapshot: { name: 'Treino A' }, sets: [] },
    { status: 'cancelled', started_at: '2026-11-03T10:00:00Z', completed_at: '2026-11-03T10:20:00Z', plan_snapshot: { name: 'Treino B' }, sets: [] },
  ], [{ name: 'Treino C', scheduledDays: [2] }, { name: 'Treino D', scheduledDays: [] }], new Date('2026-11-03T18:00:00Z'))

  expect(result).toEqual({ greeting: 'Boa tarde', weeklyWorkouts: 1, totalMinutes: 75, suggestedPlanName: 'Treino C', lastWorkoutName: 'Treino A', lastWorkoutAt: '2026-11-02T10:00:00Z' })
})
