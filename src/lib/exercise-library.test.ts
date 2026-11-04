import { expect, it } from 'vitest'
import { canManageExercise } from './exercise-library'

it('allows editing only the exercise owner', () => {
  expect(canManageExercise('lucas-id', 'lucas-id')).toBe(true)
  expect(canManageExercise('tiago-id', 'lucas-id')).toBe(false)
  expect(canManageExercise(null, 'lucas-id')).toBe(false)
})
