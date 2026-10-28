export function nextSetNumber(sets: Array<{ set_number: number }>) { return Math.max(0, ...sets.map(set => set.set_number)) + 1 }
export function canRemoveSet(_sets: Array<{ completed_at: string | null }>, set: { completed_at: string | null }) { return !set.completed_at }
export function canCompleteSet(completedAt: string | null, repetitions: number) { return !completedAt && repetitions > 0 }
export function sessionSetKey(sessionExerciseId: string, setNumber: number) { return `${sessionExerciseId}:${setNumber}` }
export function firstIncompleteExerciseIndex(exercises: Array<{ workout_sets: Array<{ completed_at: string | null }> }>) { return exercises.findIndex(exercise => exercise.workout_sets.some(set => !set.completed_at)) }
