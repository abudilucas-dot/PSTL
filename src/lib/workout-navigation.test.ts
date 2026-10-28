import { expect, it } from 'vitest'
import { shouldKeepActiveSession, shouldShowWorkout } from './workout-navigation'

it('keeps an active session available without forcing the runner after returning to plans', () => {
  expect(shouldShowWorkout(true, true)).toBe(false)
  expect(shouldShowWorkout(true, false)).toBe(true)
})

it('clears the active session after a completed workout', () => {
  expect(shouldKeepActiveSession('completed')).toBe(false)
  expect(shouldKeepActiveSession('in_progress')).toBe(true)
})
