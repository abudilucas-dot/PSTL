# Evolução Individual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a tela privada de evolução com métricas e gráficos reais para cada perfil PSTL.

**Architecture:** A UI de evolução consulta as sessões concluídas e as medidas que a RLS já restringe ao proprietário. Funções puras transformam os registros em pontos de gráfico e são cobertas por Vitest; Recharts desenha somente os pontos reais.

**Tech Stack:** React 19, TypeScript, Supabase, Recharts, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-04-evolution-design.md`

## Global Constraints

- Não expor chaves privilegiadas no navegador.
- Manter RLS: leitura e escrita exclusivamente do proprietário.
- Não inventar métricas quando não há dados.
- Layout deve funcionar em celular e desktop.

## Review Focus

- Medidas parciais devem salvar sem substituir medições antigas.
- Sem sessões, os gráficos devem exibir um estado vazio em vez de dados inventados.
- Peso corporal em zero ou altura ausente não pode produzir IMC.
- Duas sessões na mesma semana precisam somar volume e séries.
- Um perfil não pode carregar ou escrever dados de outro perfil.

### Task 1: Persistência de medidas completas

**Files:**
- Create: `supabase/migrations/202611040001_expand_body_measurements.sql`
- Create: `src/features/evolution/Evolution.tsx`
- Test: `src/lib/measurements.test.ts`

- [x] Escrever testes para validação de medidas parciais e IMC.
- [x] Adicionar a migration e aplicar no Supabase com RLS preservada.
- [x] Expor campos corporais completos no formulário e no histórico.
- [x] Rodar `npm test`.

### Task 2: Cálculos de evolução

**Files:**
- Create: `src/lib/evolution.ts`
- Test: `src/lib/evolution.test.ts`

- [x] Escrever testes para agregação semanal, frequência e pontos de peso.
- [x] Implementar funções puras de agregação.
- [x] Rodar `npm test src/lib/evolution.test.ts`.

### Task 3: Tela e gráficos de evolução

**Files:**
- Create: `src/features/evolution/Evolution.tsx`
- Modify: `src/App.tsx`, `src/styles.css`, `package.json`
- Test: `src/lib/evolution.test.ts`

- [x] Instalar Recharts com versão fixa e usar os cálculos de Task 2.
- [x] Adicionar a rota/tela Evolução à navegação mobile e desktop.
- [x] Mostrar estados vazios e gráficos de volume semanal e peso corporal.
- [x] Rodar `npm test` e `npm run build`.
