export type InitialExercise = { name: string; sets: number; repetitions: string }
const prescription = (names: string[]): InitialExercise[] => names.map(name => ({ name, sets: 4, repetitions: '10–12' }))

export const initialWorkoutPlans = [
  { name: 'Treino A', exercises: prescription(['Chest Press', 'Supino Inclinado (Máquina ou Smith)', 'Supino Inclinado com Halter', 'Crossover', 'Elevação Frontal (Pegada Neutra)', 'Elevação Lateral com Halteres', 'Tríceps Testa', 'Abdominal Reto (Livre ou na Máquina)']) },
  { name: 'Treino B', exercises: prescription(['Agachamento Livre ou Guiado', 'Pêndulo', 'Leg Press', 'Cadeira Extensora', 'Afundo', 'Cadeira Adutora', 'Elevação em Pé (Livre ou no Smith)', 'Abdominal Reto (Livre ou na Máquina)']) },
  { name: 'Treino C', exercises: prescription(['Remada Baixa (Pegada Aberta Pronada)', 'Remada Baixa (Triângulo)', 'Remada Curvada (Pegada Pronada)', 'Serrote (Remada Unilateral com Halter)', 'Meio Terra', 'Voador Invertido', 'Crucifixo Inverso com Halter (Pronado)', 'Rosca Direta']) },
  { name: 'Treino D', exercises: prescription(['Supino Inclinado com Halter', 'Crucifixo Inclinado com Halter', 'Voador', 'Desenvolvimento (Halteres ou Máquina)', 'Elevação Lateral na Polia Baixa', 'Tríceps Pulley', 'Tríceps Francês']) },
  { name: 'Treino E', exercises: prescription(['Cadeira Abdutora', 'Elevação Pélvica', 'Mesa/Cadeira Flexora em Pé Unilateral', 'Cama Flexora (Mesa Flexora)', 'Cadeira Flexora', 'Stiff', 'Elevação em Pé (Livre ou no Smith)']) },
  { name: 'Treino F', exercises: prescription(['Puxador Frente Aberto (Pegada Pronada)', 'Puxador Frente (Pegada Supinada)', 'Puxador Frente (Triângulo)', 'Pulldown', 'Voador Invertido', 'Rosca Direta', 'Abdominal Reto (Livre ou na Máquina)']) },
]
