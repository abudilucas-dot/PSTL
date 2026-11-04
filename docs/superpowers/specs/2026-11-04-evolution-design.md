# Evolução individual — design

## Intenção

Dar a Lucas, Tiago e Paulo uma tela privada para acompanhar o próprio progresso com dados reais já registrados no PSTL. A tela não compara perfis e não permite escrever dados de outra pessoa.

## Escopo desta entrega

- Resumo de treinos, séries, volume e frequência semanal.
- Gráfico de volume por semana e gráfico de peso corporal por data.
- Histórico corporal com peso, altura, braço, antebraço, peitoral, cintura, quadril, coxa, panturrilha e percentual de gordura opcional.
- Formulário de medidas com validação e persistência protegida por RLS.

## Fora de escopo

Fotos de progresso, painel familiar, calendário e demonstrações de exercícios pertencem às próximas entregas.

## Abordagens consideradas

1. Calcular os indicadores no navegador a partir de sessões e medidas. Simples, protegido pela RLS existente e adequado para a família de três pessoas.
2. Criar views ou funções SQL de resumo. Reduz tráfego, mas adiciona lógica privilegiada desnecessária nesta fase.

Foi escolhida a primeira opção. Consultas serão limitadas aos registros do próprio usuário, com índices já existentes para sessões e medidas.

## Segurança

As medidas continuam vinculadas a `owner_id = auth.uid()` por políticas RLS. O formulário não escolhe outro proprietário e usa somente a sessão Supabase autenticada.
