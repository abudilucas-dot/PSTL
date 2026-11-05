# Testes

Execute:

```bash
npm test
npm run build
```

Os testes unitários cobrem cálculos de volume, séries, histórico, navegação de treino, calendário, evolução, recuperação, família, mídia, fotos, exportação e preferências.

Antes de publicar uma migration, confirme no Supabase:

1. RLS ativo nas novas tabelas.
2. Políticas de leitura/escrita compatíveis com o proprietário.
3. Buckets privados e políticas de Storage.
4. Security Advisor sem alertas novos causados pela migration.
