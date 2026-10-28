import { describe, expect, it } from 'vitest'
import { initialWorkoutPlans } from './default-plans'

describe('initialWorkoutPlans', () => {
  it('keeps the six PDF divisions and their prescribed 4 × 10–12 defaults', () => {
    expect(initialWorkoutPlans.map(plan => plan.name)).toEqual(['Treino A', 'Treino B', 'Treino C', 'Treino D', 'Treino E', 'Treino F'])
    expect(initialWorkoutPlans.flatMap(plan => plan.exercises).every(exercise => exercise.sets === 4 && exercise.repetitions === '10–12')).toBe(true)
  })
})
