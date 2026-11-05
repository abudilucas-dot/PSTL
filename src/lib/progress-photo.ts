const maxProgressPhotoBytes = 10 * 1024 * 1024
const allowedPhotoTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export function isSupportedProgressPhoto(type: string, size: number) {
  return allowedPhotoTypes.has(type) && size <= maxProgressPhotoBytes
}
