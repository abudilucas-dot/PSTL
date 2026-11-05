import { expect, it } from 'vitest'
import { exerciseProgress, lastExercisePerformance } from './exercise-progress'

it('builds personal exercise metrics from completed recorded sets', () => {
  const result = exerciseProgress([
    { sessionId: 'old', startedAt: '2026-10-20T12:00:00Z', sets: [{ completed_at: '2026-10-20T12:10:00Z', load_kg: 20, repetitions: 10 }] },
    { sessionId: 'new', startedAt: '2026-11-02T12:00:00Z', sets: [{ completed_at: '2026-11-02T12:10:00Z', load_kg: 25, repetitions: 8 }, { completed_at: null, load_kg: 40, repetitions: 10 }] },
  ])

  expect(result.maxLoadKg).toBe(25)
  expect(result.maxSessionVolume).toBe(200)
  expect(result.last?.sessionId).toBe('new')
  expect(result.points).toEqual([
    { sessionId: 'old', date: '20/10', maxLoadKg: 20, repetitions: 10, volume: 200 },
    { sessionId: 'new', date: '02/11', maxLoadKg: 25, repetitions: 8, volume: 200 },
  ])
})

it('returns the last completed set without changing the next exercise inputs', () => {
  const result = lastExercisePerformance([
    { sessionId: 'old', startedAt: '2026-10-20T12:00:00Z', sets: [{ completed_at: '2026-10-20T12:10:00Z', load_kg: 20, repetitions: 10 }] },
    { sessionId: 'new', startedAt: '2026-11-02T12:00:00Z', sets: [{ completed_at: '2026-11-02T12:10:00Z', load_kg: 25, repetitions: 8 }, { completed_at: '2026-11-02T12:12:00Z', load_kg: 22.5, repetitions: 10 }] },
  ])

  expect(result).toEqual({ loadKg: 22.5, repetitions: 10, completedAt: '2026-11-02T12:12:00Z' })
})
