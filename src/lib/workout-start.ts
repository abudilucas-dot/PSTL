export function workoutAction(hasActiveWorkout: boolean, isStarting: boolean) {
  if (isStarting) return 'starting'
  return hasActiveWorkout ? 'resume' : 'start'
}
