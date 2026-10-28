import { expect, it } from 'vitest'
import { nextSetNumber, canRemoveSet, canCompleteSet, sessionSetKey } from './session-sets'

it('only removes an unfinished set when another set remains', () => {
  expect(nextSetNumber([{ set_number: 1 }, { set_number: 3 }])).toBe(4)
  expect(canRemoveSet([{ completed_at: null }, { completed_at: null }], { completed_at: null })).toBe(true)
  expect(canRemoveSet([{ completed_at: null }], { completed_at: null })).toBe(false)
  expect(canRemoveSet([{ completed_at: null }, { completed_at: null }], { completed_at: '2026-10-28T00:00:00Z' })).toBe(false)
})

it('does not allow a completed set to be submitted again', () => {
  expect(canCompleteSet(null, 10)).toBe(true)
  expect(canCompleteSet('2026-10-28T00:00:00Z', 10)).toBe(false)
})

it('keeps set field identities separate between exercises', () => {
  expect(sessionSetKey('exercise-a', 1)).not.toBe(sessionSetKey('exercise-b', 1))
})
