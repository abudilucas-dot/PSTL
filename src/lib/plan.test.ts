import { describe, expect, it } from 'vitest'
import { normalizePositions, type PlanExerciseInput } from './plan'

describe('normalizePositions', () => {
  it('reindexes a reordered plan without changing individual prescription fields', () => {
    const rows: PlanExerciseInput[] = [
      {
        id: 'second',
        exerciseId: 'chest-press',
        position: 9,
        sets: 4,
        repetitions: '10–12',
        plannedLoadKg: 35,
        restSeconds: 90,
        notes: 'Controle a descida',
      },
      {
        id: 'first',
        exerciseId: 'crossover',
        position: 3,
        sets: 3,
        repetitions: '12',
        plannedLoadKg: null,
        restSeconds: 60,
        notes: '',
      },
    ]

    expect(normalizePositions(rows)).toEqual([
      { ...rows[0], position: 0 },
      { ...rows[1], position: 1 },
    ])
  })
})
