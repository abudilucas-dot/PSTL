import { expect, it } from 'vitest'
import { isSupportedProgressPhoto } from './progress-photo'

it('accepts progress photos only when they are supported images within ten megabytes', () => {
  expect(isSupportedProgressPhoto('image/jpeg', 9 * 1024 * 1024)).toBe(true)
  expect(isSupportedProgressPhoto('image/webp', 10 * 1024 * 1024)).toBe(true)
  expect(isSupportedProgressPhoto('image/svg+xml', 1_000)).toBe(false)
  expect(isSupportedProgressPhoto('video/mp4', 1_000)).toBe(false)
  expect(isSupportedProgressPhoto('image/png', 10 * 1024 * 1024 + 1)).toBe(false)
})
