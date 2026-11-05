import { expect, it } from 'vitest'
import { normalizeWorkoutPreferences } from './workout-preferences'

it('normalizes the saved workout preferences to safe defaults', () => {
  expect(normalizeWorkoutPreferences({ default_rest_seconds: 120, sound_enabled: true, vibration_enabled: false })).toEqual({ defaultRestSeconds: 120, soundEnabled: true, vibrationEnabled: false })
  expect(normalizeWorkoutPreferences({ default_rest_seconds: 4000, sound_enabled: false, vibration_enabled: true })).toEqual({ defaultRestSeconds: 90, soundEnabled: false, vibrationEnabled: true })
})
