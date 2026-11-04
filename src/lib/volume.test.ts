import { expect, it } from 'vitest'
import { formatTrainingVolume } from './volume'

it('formats large training volume in a readable way', () => {
  expect(formatTrainingVolume(850)).toBe('850 kg')
  expect(formatTrainingVolume(17437)).toBe('17,4 mil kg')
})
