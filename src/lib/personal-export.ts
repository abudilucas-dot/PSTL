type ExportInput = {
  exportedAt: string
  profile: { display_name: string }
  sessions: unknown[]
  measurements: unknown[]
  recoveryCheckins: unknown[]
  progressPhotos: Array<Record<string, unknown>>
}

export function buildPersonalExport(input: ExportInput) {
  return {
    format: 'pstl-personal-export',
    version: 1,
    exported_at: input.exportedAt,
    profile: input.profile,
    workout_sessions: input.sessions,
    body_measurements: input.measurements,
    recovery_checkins: input.recoveryCheckins,
    progress_photos: input.progressPhotos.map(({ photo_path: _photoPath, ...photo }) => photo),
  }
}
