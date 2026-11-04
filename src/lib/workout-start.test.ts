import { expect, it } from 'vitest'
import { workoutAction } from './workout-start'

it('opens an existing workout instead of starting another one', () => {
  expect(workoutAction(false, false)).toBe('start')
  expect(workoutAction(true, false)).toBe('resume')
  expect(workoutAction(false, true)).toBe('starting')
})
