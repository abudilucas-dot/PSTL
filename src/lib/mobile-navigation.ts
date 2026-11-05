export const mobileNavigation = [
  { id: 'dashboard', label: 'Início' },
  { id: 'plans', label: 'Treino' },
  { id: 'exercises', label: 'Exercícios' },
  { id: 'evolution', label: 'Evolução' },
  { id: 'family', label: 'Família' },
] as const

export type MobileDestination = typeof mobileNavigation[number]['id']
