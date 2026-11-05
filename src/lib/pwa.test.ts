import { expect, it } from 'vitest'
import { pwaInstallStatus } from './pwa'

it('describes the available PWA installation path', () => {
  expect(pwaInstallStatus({ isStandalone: true, canPrompt: true, isIos: false })).toBe('installed')
  expect(pwaInstallStatus({ isStandalone: false, canPrompt: true, isIos: false })).toBe('ready')
  expect(pwaInstallStatus({ isStandalone: false, canPrompt: false, isIos: true })).toBe('ios')
  expect(pwaInstallStatus({ isStandalone: false, canPrompt: false, isIos: false })).toBe('unavailable')
})
