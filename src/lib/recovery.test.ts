import { expect, it } from 'vitest'
import { recoverySummary } from './recovery'

it('marks a recently trained high-volume muscle group as a recovery estimate, not a diagnosis', () => {
  const summary = recoverySummary([
    { status: 'completed', started_at: '2026-11-04T09:00:00Z', workout_session_exercises: [{ exercise_name: 'Supino Inclinado com Halter', workout_sets: [{ completed_at: '2026-11-04T09:10:00Z' }, { completed_at: '2026-11-04T09:20:00Z' }, { completed_at: '2026-11-04T09:30:00Z' }] }] },
    { status: 'completed', started_at: '2026-10-30T09:00:00Z', workout_session_exercises: [{ exercise_name: 'Rosca Direta', workout_sets: [{ completed_at: '2026-10-30T09:10:00Z' }] }] },
  ], new Date('2026-11-04T18:00:00Z'))

  expect(summary.find(group => group.id === 'chest')).toMatchObject({ level: 'high', lastTrainedAt: '2026-11-04T09:00:00Z' })
  expect(summary.find(group => group.id === 'biceps')).toMatchObject({ level: 'rested', lastTrainedAt: '2026-10-30T09:00:00Z' })
  expect(summary.find(group => group.id === 'calves')).toMatchObject({ level: 'unknown', lastTrainedAt: null })
})
