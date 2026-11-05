# Deploy

1. Envie a branch `main` ao GitHub.
2. Importe o repositório na Vercel.
3. Em **Settings → Environment Variables**, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para Production, Preview e Development.
4. Use o comando de build `npm run build` e diretório de saída `dist`.
5. Aplique as migrations do diretório `supabase/migrations/` no projeto Supabase ligado ao ambiente.
6. Abra a URL publicada, faça login e teste o registro de uma série antes de apontar um domínio próprio.

Para domínio próprio, adicione-o primeiro na Vercel e depois inclua a URL final nas URLs permitidas de autenticação do Supabase. Não adicione segredos ao GitHub.

Depois de um novo deploy, recarregue o PWA uma vez quando houver atualização de assets para que o service worker passe a servir a versão nova.
