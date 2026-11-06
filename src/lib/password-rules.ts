export function passwordValidationMessage(password: string) {
  if (password.length < 8) return 'A nova senha precisa ter pelo menos 8 caracteres.'
  if (!/[a-z]/.test(password)) return 'A senha precisa incluir uma letra minúscula.'
  if (!/[A-Z]/.test(password)) return 'A senha precisa incluir uma letra maiúscula.'
  if (!/\d/.test(password)) return 'A senha precisa incluir um número.'
  if (!/[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/.test(password)) return 'A senha precisa incluir um caractere especial, como ! ou @.'
  return null
}
