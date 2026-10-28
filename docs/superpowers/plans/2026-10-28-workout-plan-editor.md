# Editor de fichas personalizáveis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um editor de fichas pessoais persistente, responsivo e protegido por RLS.

**Architecture:** Uma SPA React autenticada pelo Supabase mantém os planos em consultas invalidáveis. O banco impõe propriedade na ficha e em seus itens; sessões mantêm cópias do plano para que alterações futuras não reescrevam o histórico.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, Supabase, TanStack Query, React Hook Form, Zod, dnd-kit, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-28-workout-plan-editor-design.md`

## Global Constraints

- Não incluir segredos no frontend; usar somente URL e chave anônima públicas em variáveis `VITE_*`.
- Toda escrita é autorizada pelo Supabase RLS, nunca pela seleção de perfil do navegador.
- Fichas A–F são cópias pessoais; sessões preservam um snapshot da execução.
- Ações destrutivas pedem confirmação e são exclusões lógicas.
- Experiência deve funcionar com toque e teclado, sem controles decorativos.

## Review Focus

- Trocar `owner_id` na requisição não pode permitir escrita em ficha de outra pessoa; teste de RLS na migração.
- Reordenar itens mantém posições contínuas e não perde campos individuais; teste do normalizador.
- Arquivar/excluir plano não deleta sessões nem seus snapshots; teste de integridade SQL.
- Falha de upload não grava URL inexistente no exercício; teste do serviço de mídia.
- Estado de salvo só é confirmado após a mutação resolver; teste do hook de salvamento.

### Task 1: Fundação e modelo de domínio

**Files:**
- Create: `package.json`, `vite.config.ts`, `src/lib/plan.ts`, `src/lib/plan.test.ts`
- Create: `supabase/migrations/202610280001_workout_plan_editor.sql`
- Create: `.env.example`, `README.md`

**Interfaces:**
- Produces `normalizePositions(items: PlanExerciseInput[]): PlanExerciseInput[]` e schema Supabase de planos/snapshots.

- [ ] Escrever testes falhos para normalização de posições e preservação dos campos de exercício.
- [ ] Executar `npm test -- src/lib/plan.test.ts` e confirmar falha por módulo ausente.
- [ ] Implementar modelo, migração com constraints/RLS e configuração mínima.
- [ ] Executar `npm test -- src/lib/plan.test.ts` e confirmar aprovação.

### Task 2: Cliente e operações persistentes

**Files:**
- Create: `src/lib/supabase.ts`, `src/features/plans/api.ts`, `src/features/plans/api.test.ts`
- Create: `src/features/exercises/media.ts`

**Interfaces:**
- Consumes `PlanExerciseInput`.
- Produces `saveWorkoutPlan(input)`, `duplicateWorkoutPlan(id)`, `archiveWorkoutPlan(id)`, `softDeleteWorkoutPlan(id)` e `uploadExerciseMedia(file, ownerId)`.

- [ ] Escrever testes falhos para o payload de itens ordenados e para upload que não persiste URL após erro.
- [ ] Executar os testes e confirmar falha esperada.
- [ ] Implementar chamadas Supabase tipadas e upload privado por dono.
- [ ] Executar os testes e confirmar aprovação.

### Task 3: Editor de fichas acessível

**Files:**
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles.css`
- Create: `src/features/plans/WorkoutPlanEditor.tsx`, `src/features/plans/ExerciseRow.tsx`, `src/features/plans/WorkoutPlanEditor.test.tsx`

**Interfaces:**
- Consumes operações da Task 2.
- Produces um editor com nome/descrição/dias, campos individuais, biblioteca, DnD, criação/duplicação/arquivamento/exclusão e confirmação real de salvamento.

- [ ] Escrever testes falhos para edição independente de exercícios, reordenação e confirmação apenas depois do sucesso.
- [ ] Executar testes e confirmar falha esperada.
- [ ] Implementar UI mobile-first com controles funcionais e feedback de mutação.
- [ ] Executar testes do componente e confirmar aprovação.

### Task 4: Verificação de produção

**Files:**
- Modify: `README.md`

- [ ] Rodar a suíte Vitest completa.
- [ ] Rodar `npm run build`.
- [ ] Documentar aplicação da migração e provisão dos três perfis no Supabase.
