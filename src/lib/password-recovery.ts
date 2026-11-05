export function passwordChangeMode(recoveryMode: boolean) {
  return recoveryMode ? 'new-only' : 'current-and-new'
}
