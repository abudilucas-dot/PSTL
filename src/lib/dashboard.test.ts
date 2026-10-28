import { expect, it } from 'vitest'
import { dashboardSummary } from './dashboard'

it('summarizes completed sessions without inventing percentage progress', () => {
  expect(dashboardSummary([{ status: 'completed', started_at: '2026-10-27', sets: [{ completed_at: 'x', load_kg: 20, repetitions: 10 }] }, { status: 'cancelled', started_at: '2026-10-28', sets: [] }])).toEqual({ completedSessions: 1, completedSets: 1, volume: 200 })
})
