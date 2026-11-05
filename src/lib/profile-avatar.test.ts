import { expect, it } from 'vitest'
import { isSupportedProfileAvatar } from './profile-avatar'

it('accepts only image avatars up to five megabytes', () => {
  expect(isSupportedProfileAvatar('image/jpeg', 4 * 1024 * 1024)).toBe(true)
  expect(isSupportedProfileAvatar('image/png', 5 * 1024 * 1024)).toBe(true)
  expect(isSupportedProfileAvatar('video/mp4', 1_000)).toBe(false)
  expect(isSupportedProfileAvatar('image/webp', 5 * 1024 * 1024 + 1)).toBe(false)
})
