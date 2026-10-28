import { describe, expect, it } from 'vitest'
import { sessionVolume } from './session'

describe('sessionVolume', () => {
  it('sums only completed weighted sets', () => {
    expect(sessionVolume([{ completed: true, loadKg: 35, repetitions: 10 }, { completed: false, loadKg: 40, repetitions: 8 }, { completed: true, loadKg: 17.5, repetitions: 12 }])).toBe(560)
  })
})
