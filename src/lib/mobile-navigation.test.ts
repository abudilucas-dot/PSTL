import { expect, it } from 'vitest'
import { mobileNavigation } from './mobile-navigation'

it('keeps the five primary PSTL destinations available on mobile', () => {
  expect(mobileNavigation.map(item => item.label)).toEqual(['Início', 'Treino', 'Exercícios', 'Evolução', 'Família'])
})
