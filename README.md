# PSTL

PSTL é um editor de fichas de musculação individuais para Lucas, Tiago e Paulo. Esta primeira etapa fornece fichas persistentes no Supabase, edição de prescrição por exercício e isolamento de escrita por RLS.

## Executar localmente

1. Crie um projeto Supabase e aplique `supabase/migrations/202610280001_workout_plan_editor.sql` no SQL Editor ou com a CLI.
2. Provisione os três usuários em **Authentication > Users** e insira os respectivos perfis em `public.profiles` com o mesmo UUID de `auth.users`.
3. Copie `.env.example` para `.env.local` e informe somente a URL e a chave pública anônima.
4. Execute `npm install`, `npm run dev`.

O banco não permite ao cliente escolher o dono: as políticas usam a identidade autenticada de `auth.uid()`. A chave `service_role` nunca deve ser adicionada ao frontend.

## Verificações

`npm test` executa a suíte; `npm run build` produz o bundle de produção.
