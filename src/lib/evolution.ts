type WorkoutSet = { completed_at: string | null; load_kg: number | null; repetitions: number }
type WorkoutSession = { status: string; started_at: string; workout_session_exercises: Array<{ workout_sets: WorkoutSet[] }> }
type WeightMeasurement = { measured_at: string; weight_kg: number | null }
type BodyMeasurement = { weight_kg: number | null; height_cm: number | null; arm_cm: number | null; forearm_cm: number | null; chest_cm: number | null; waist_cm: number | null; hip_cm: number | null; thigh_cm: number | null; calf_cm: number | null; body_fat_percent: number | null; custom_measurements: Record<string, number> }

const dayMonth = (date: Date) => `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`

function saoPauloWeekStart(isoDate: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(isoDate))
  const value = (name: string) => Number(parts.find(part => part.type === name)?.value)
  const date = new Date(Date.UTC(value('year'), value('month') - 1, value('day')))
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7))
  return date
}

export function weeklyTrainingPoints(sessions: WorkoutSession[]) {
  const points = new Map<string, { week: string; volume: number; sessions: number; sets: number }>()
  sessions.filter(session => session.status === 'completed').forEach(session => {
    const weekStart = saoPauloWeekStart(session.started_at)
    const week = dayMonth(weekStart)
    const weekKey = `${weekStart.getUTCFullYear()}-${String(weekStart.getUTCMonth() + 1).padStart(2, '0')}-${String(weekStart.getUTCDate()).padStart(2, '0')}`
    const current = points.get(weekKey) ?? { week, volume: 0, sessions: 0, sets: 0 }
    current.sessions += 1
    session.workout_session_exercises.flatMap(exercise => exercise.workout_sets).filter(set => Boolean(set.completed_at)).forEach(set => {
      current.sets += 1
      current.volume += (set.load_kg ?? 0) * set.repetitions
    })
    points.set(weekKey, current)
  })
  return [...points.entries()].sort(([first], [second]) => first.localeCompare(second)).map(([, point]) => point)
}

export function bodyWeightPoints(measurements: WeightMeasurement[]) {
  return measurements.filter(measurement => measurement.weight_kg !== null).sort((a, b) => a.measured_at.localeCompare(b.measured_at)).map(measurement => ({ date: measurement.measured_at.slice(8, 10) + '/' + measurement.measured_at.slice(5, 7), weight: measurement.weight_kg! }))
}

export function measurementSummary(measurement: BodyMeasurement) {
  return [measurement.weight_kg !== null && `${measurement.weight_kg} kg`, measurement.height_cm !== null && `${measurement.height_cm} cm`, measurement.arm_cm !== null && `braço ${measurement.arm_cm} cm`, measurement.forearm_cm !== null && `antebraço ${measurement.forearm_cm} cm`, measurement.chest_cm !== null && `peitoral ${measurement.chest_cm} cm`, measurement.waist_cm !== null && `cintura ${measurement.waist_cm} cm`, measurement.hip_cm !== null && `quadril ${measurement.hip_cm} cm`, measurement.thigh_cm !== null && `coxa ${measurement.thigh_cm} cm`, measurement.calf_cm !== null && `panturrilha ${measurement.calf_cm} cm`, measurement.body_fat_percent !== null && `${measurement.body_fat_percent}% gordura`, ...Object.entries(measurement.custom_measurements ?? {}).map(([name, value]) => `${name} ${value}`)].filter(Boolean).join(' · ')
}
