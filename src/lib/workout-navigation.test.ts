import { expect, it } from 'vitest'
import { shouldShowWorkout } from './workout-navigation'

it('keeps an active session available without forcing the runner after returning to plans', () => {
  expect(shouldShowWorkout(true, true)).toBe(false)
  expect(shouldShowWorkout(true, false)).toBe(true)
})
