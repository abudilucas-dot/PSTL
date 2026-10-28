type HistorySet = { completed_at: string | null; load_kg: number | null; repetitions: number }
export function completedSetCount(sets: HistorySet[]) { return sets.filter(set => set.completed_at).length }
export function historyVolume(sets: HistorySet[]) { return sets.reduce((total,set)=>total+(set.completed_at&&set.load_kg?set.load_kg*set.repetitions:0),0) }
