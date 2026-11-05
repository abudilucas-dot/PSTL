import { expect, it } from 'vitest'
import { passwordChangeMode } from './password-recovery'

it('uses a new-password-only form after a verified recovery link', () => {
  expect(passwordChangeMode(false)).toBe('current-and-new')
  expect(passwordChangeMode(true)).toBe('new-only')
})
