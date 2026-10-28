export function shouldShowWorkout(hasActiveSession: boolean, dismissed: boolean) { return hasActiveSession && !dismissed }
export function shouldKeepActiveSession(status: string) { return status === 'in_progress' }
