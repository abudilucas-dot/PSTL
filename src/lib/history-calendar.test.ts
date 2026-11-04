import { expect, it } from 'vitest'
import { calendarCells, historyDateKey } from './history-calendar'

it('groups sessions by their local calendar day without including other months', () => {
  const sessions = [
    { id: 'a', started_at: '2026-12-03T12:00:00Z' },
    { id: 'b', started_at: '2026-12-03T18:00:00Z' },
    { id: 'c', started_at: '2026-11-30T18:00:00Z' },
  ]

  const cells = calendarCells(2026, 11, sessions)
  const december3 = cells.find(cell => cell.date === '2026-12-03')
  const november30 = cells.find(cell => cell.date === '2026-11-30')

  expect(historyDateKey('2026-12-03T12:00:00Z')).toBe('2026-12-03')
  expect(december3?.sessionIds).toEqual(['a', 'b'])
  expect(november30?.sessionIds).toEqual([])
})
