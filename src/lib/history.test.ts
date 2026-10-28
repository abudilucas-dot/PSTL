import { expect, it } from 'vitest'
import { completedSetCount, historyVolume } from './history'

it('summarizes only completed sets in workout history', () => {
  const sets = [{ completed_at: '2026-10-28T10:00:00Z', load_kg: 30, repetitions: 10 }, { completed_at: null, load_kg: 30, repetitions: 10 }]
  expect(completedSetCount(sets)).toBe(1)
  expect(historyVolume(sets)).toBe(300)
})
