import { expect, it } from 'vitest'
import { isSupportedExerciseMedia } from './exercise-media'

it('accepts image and video demonstration files only', () => {
  expect(isSupportedExerciseMedia('image/jpeg', 4_000_000)).toBe(true)
  expect(isSupportedExerciseMedia('video/mp4', 15_000_000)).toBe(true)
  expect(isSupportedExerciseMedia('application/pdf', 1_000)).toBe(false)
  expect(isSupportedExerciseMedia('image/png', 25_000_000)).toBe(false)
})
