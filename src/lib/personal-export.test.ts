import { expect, it } from 'vitest'
import { buildPersonalExport } from './personal-export'

it('creates a portable export containing only the supplied personal records', () => {
  const exported = buildPersonalExport({
    exportedAt: '2026-11-05T12:00:00.000Z',
    profile: { display_name: 'Lucas' },
    sessions: [{ id: 'session-1', status: 'completed' }],
    measurements: [{ id: 'measure-1', weight_kg: 70 }],
    recoveryCheckins: [{ id: 'recovery-1', soreness: 2 }],
    progressPhotos: [{ id: 'photo-1', taken_at: '2026-11-01', shared_with_family: false }],
  })

  expect(exported.format).toBe('pstl-personal-export')
  expect(exported.profile.display_name).toBe('Lucas')
  expect(exported.workout_sessions).toHaveLength(1)
  expect(exported.body_measurements).toHaveLength(1)
  expect(exported.recovery_checkins).toHaveLength(1)
  expect(exported.progress_photos[0]).not.toHaveProperty('photo_path')
})
