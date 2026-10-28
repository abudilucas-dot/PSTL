export function nextSetNumber(sets: Array<{ set_number: number }>) { return Math.max(0, ...sets.map(set => set.set_number)) + 1 }
export function canRemoveSet(sets: Array<{ completed_at: string | null }>, set: { completed_at: string | null }) { return sets.length > 1 && !set.completed_at }
export function canCompleteSet(completedAt: string | null, repetitions: number) { return !completedAt && repetitions > 0 }
export function sessionSetKey(sessionExerciseId: string, setNumber: number) { return `${sessionExerciseId}:${setNumber}` }
