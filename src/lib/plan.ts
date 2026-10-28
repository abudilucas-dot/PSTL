export type PlanExerciseInput = {
  id: string
  exerciseId: string
  position: number
  sets: number
  repetitions: string
  plannedLoadKg: number | null
  restSeconds: number
  notes: string
}

export function normalizePositions(items: PlanExerciseInput[]): PlanExerciseInput[] {
  return items.map((item, position) => ({ ...item, position }))
}
