export type WorkoutPreferences = { defaultRestSeconds: number; soundEnabled: boolean; vibrationEnabled: boolean }

export const defaultWorkoutPreferences: WorkoutPreferences = { defaultRestSeconds: 90, soundEnabled: false, vibrationEnabled: false }

export function normalizeWorkoutPreferences(value: { default_rest_seconds?: number | null; sound_enabled?: boolean | null; vibration_enabled?: boolean | null } | null | undefined): WorkoutPreferences {
  const rest = value?.default_rest_seconds
  return {
    defaultRestSeconds: typeof rest === 'number' && rest >= 0 && rest <= 3600 ? rest : defaultWorkoutPreferences.defaultRestSeconds,
    soundEnabled: Boolean(value?.sound_enabled),
    vibrationEnabled: Boolean(value?.vibration_enabled),
  }
}
