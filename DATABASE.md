# Banco de dados

Todas as mudanças de schema ficam em `supabase/migrations/` e devem ser aplicadas em ordem.

Principais tabelas:

- `profiles` e `family_groups`: identidade e agrupamento familiar.
- `workout_plans` e `workout_plan_exercises`: fichas pessoais.
- `workout_sessions`, `workout_session_exercises` e `workout_sets`: execução e histórico imutável da sessão.
- `exercises`: biblioteca global/pessoal.
- `body_measurements`, `recovery_checkins` e `progress_photos`: evolução individual.
- `user_preferences`: descanso padrão e avisos de treino.

Buckets privados: `exercise-media`, `profile-avatars` e `progress-photos`. URLs são assinadas e temporárias. Cada tabela exposta possui RLS; gravação exige que `auth.uid()` seja o proprietário.

Após uma migration de segurança, execute o Security Advisor do Supabase e valide que RLS está ativo e que as políticas esperadas existem.
