const maxAvatarBytes = 5 * 1024 * 1024

export function isSupportedProfileAvatar(type: string, size: number) {
  return type.startsWith('image/') && size <= maxAvatarBytes
}
