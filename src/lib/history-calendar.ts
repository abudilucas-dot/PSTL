export type CalendarSession = { id: string; started_at: string }
export type CalendarCell = { date: string; inCurrentMonth: boolean; sessionIds: string[] }

const pad = (value: number) => String(value).padStart(2, '0')

export function historyDateKey(value: string): string {
  const date = new Date(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function calendarCells(year: number, month: number, sessions: CalendarSession[]): CalendarCell[] {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  const currentMonth = `${year}-${pad(month + 1)}`
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    const inCurrentMonth = key.startsWith(currentMonth)
    return { date: key, inCurrentMonth, sessionIds: inCurrentMonth ? sessions.filter(session => historyDateKey(session.started_at) === key).map(session => session.id) : [] }
  })
}
