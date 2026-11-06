import { expect, it } from 'vitest'
import { passwordValidationMessage } from './password-rules'

it('requires the password policy configured in Supabase', () => {
  expect(passwordValidationMessage('senhafraca')).toContain('maiúscula')
  expect(passwordValidationMessage('SenhaFraca')).toContain('número')
  expect(passwordValidationMessage('Senha123')).toContain('especial')
  expect(passwordValidationMessage('Senha123!')).toBeNull()
})
