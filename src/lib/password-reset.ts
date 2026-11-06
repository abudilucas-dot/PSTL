export function passwordResetNotice(email: string) {
  if (!email.trim()) return 'Informe seu e-mail para receber o link de redefinição.'
  return 'Se o e-mail estiver cadastrado, enviamos um link para redefinir sua senha.'
}
