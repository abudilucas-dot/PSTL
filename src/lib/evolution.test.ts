import { expect, it } from 'vitest'
import { bodyWeightPoints, measurementSummary, weeklyTrainingPoints } from './evolution'

it('groups completed sets into the same local training week', () => {
  const points = weeklyTrainingPoints([
    { status: 'completed', started_at: '2026-11-02T12:00:00-03:00', workout_session_exercises: [{ workout_sets: [{ completed_at: '2026-11-02T12:30:00-03:00', load_kg: 20, repetitions: 10 }] }] },
    { status: 'completed', started_at: '2026-11-04T12:00:00-03:00', workout_session_exercises: [{ workout_sets: [{ completed_at: '2026-11-04T12:30:00-03:00', load_kg: 25, repetitions: 8 }] }] },
    { status: 'cancelled', started_at: '2026-11-05T12:00:00-03:00', workout_session_exercises: [{ workout_sets: [{ completed_at: '2026-11-05T12:30:00-03:00', load_kg: 99, repetitions: 99 }] }] },
  ])

  expect(points).toEqual([{ week: '02/11', volume: 400, sessions: 2, sets: 2 }])
})

it('uses only real saved body weights as chart points', () => {
  expect(bodyWeightPoints([
    { measured_at: '2026-11-04', weight_kg: null },
    { measured_at: '2026-11-03', weight_kg: 67.2 },
    { measured_at: '2026-11-04', weight_kg: 67 },
  ])).toEqual([
    { date: '03/11', weight: 67.2 },
    { date: '04/11', weight: 67 },
  ])
})

it('orders weekly points from oldest to newest even when history is newest first', () => {
  const points = weeklyTrainingPoints([
    { status: 'completed', started_at: '2026-11-09T12:00:00-03:00', workout_session_exercises: [] },
    { status: 'completed', started_at: '2026-11-02T12:00:00-03:00', workout_session_exercises: [] },
  ])

  expect(points.map(point => point.week)).toEqual(['02/11', '09/11'])
})

it('includes every recorded body measurement in the history description', () => {
  expect(measurementSummary({ weight_kg: 67, height_cm: 176, arm_cm: 35, forearm_cm: 28, chest_cm: 102, waist_cm: 80, hip_cm: 96, thigh_cm: 60, calf_cm: 39, body_fat_percent: 14, custom_measurements: { Pescoço: 38 } })).toContain('panturrilha 39 cm')
})
