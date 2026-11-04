export function canManageExercise(ownerId: string | null, userId: string) {
  return Boolean(ownerId && userId && ownerId === userId)
}
