import { expect, it } from 'vitest'
import { familySummary } from './family'

it('keeps each family member progress separate while summarizing completed workouts', () => {
  const members = [
    { id: 'lucas', display_name: 'Lucas', avatar_path: 'lucas/avatar.webp' },
    { id: 'tiago', display_name: 'Tiago' },
  ]
  const sessions = [
    {
      owner_id: 'lucas', status: 'completed', started_at: '2026-11-03T10:00:00Z', plan_snapshot: { name: 'Treino A' },
      workout_session_exercises: [{ workout_sets: [{ completed_at: '2026-11-03T10:30:00Z', load_kg: 20, repetitions: 10 }] }],
    },
    {
      owner_id: 'lucas', status: 'cancelled', started_at: '2026-11-04T10:00:00Z', plan_snapshot: { name: 'Treino B' },
      workout_session_exercises: [{ workout_sets: [{ completed_at: '2026-11-04T10:30:00Z', load_kg: 99, repetitions: 10 }] }],
    },
    {
      owner_id: 'tiago', status: 'completed', started_at: '2026-10-20T10:00:00Z', plan_snapshot: { name: 'Treino C' },
      workout_session_exercises: [{ workout_sets: [{ completed_at: '2026-10-20T10:30:00Z', load_kg: 30, repetitions: 8 }] }],
    },
  ]

  expect(familySummary(members, sessions, new Date('2026-11-04T12:00:00Z'))).toEqual([
    { id: 'lucas', name: 'Lucas', avatarPath: 'lucas/avatar.webp', completedWorkouts: 1, weekWorkouts: 1, volume: 200, bestLoadKg: 20, lastWorkoutName: 'Treino A', lastWorkoutAt: '2026-11-03T10:00:00Z' },
    { id: 'tiago', name: 'Tiago', avatarPath: null, completedWorkouts: 1, weekWorkouts: 0, volume: 240, bestLoadKg: 30, lastWorkoutName: 'Treino C', lastWorkoutAt: '2026-10-20T10:00:00Z' },
  ])
})
