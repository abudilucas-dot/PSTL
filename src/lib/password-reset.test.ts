import { describe, expect, it } from 'vitest'
import { passwordResetNotice } from './password-reset'

describe('passwordResetNotice', () => {
  it('asks for the email before a recovery request is sent', () => {
    expect(passwordResetNotice('')).toBe('Informe seu e-mail para receber o link de redefinição.')
  })

  it('confirms that a recovery link was requested for a filled email', () => {
    expect(passwordResetNotice('paulo@example.com')).toContain('enviamos um link')
  })
})
