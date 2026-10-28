export type LoggedSet = { completed: boolean; loadKg: number | null; repetitions: number }
export function sessionVolume(sets: LoggedSet[]) { return sets.reduce((total, set) => total + (set.completed && set.loadKg ? set.loadKg * set.repetitions : 0), 0) }
