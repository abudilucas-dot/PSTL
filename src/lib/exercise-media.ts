const maxBytes = 20 * 1024 * 1024

export function isSupportedExerciseMedia(type: string, size: number) {
  return (type.startsWith('image/') || type.startsWith('video/')) && size <= maxBytes
}
