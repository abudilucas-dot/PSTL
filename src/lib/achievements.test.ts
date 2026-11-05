import { expect, it } from 'vitest'
import { earnedAchievementIds } from './achievements'

it('awards milestones from completed sessions and identifies a genuine new load record', () => {
  const sessions = Array.from({ length: 5 }, (_, index) => ({
    status: 'completed',
    startedAt: new Date(Date.UTC(2026, 10, 5 - index)).toISOString(),
    sets: [{ completed_at: 'done', load_kg: 24 - index, repetitions: 10 }],
  }))

  expect(earnedAchievementIds(sessions, new Date('2026-11-05T12:00:00Z'))).toEqual(['first-workout', 'five-workouts', 'weekly-frequency', 'new-personal-record'])
})
