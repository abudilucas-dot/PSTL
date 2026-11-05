export type PwaInstallStatus = 'installed' | 'ready' | 'ios' | 'unavailable'

export function pwaInstallStatus(input: { isStandalone: boolean; canPrompt: boolean; isIos: boolean }): PwaInstallStatus {
  if (input.isStandalone) return 'installed'
  if (input.canPrompt) return 'ready'
  if (input.isIos) return 'ios'
  return 'unavailable'
}
