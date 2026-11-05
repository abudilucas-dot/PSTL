# PSTL

PSTL é o aplicativo familiar de treino de Lucas, Tiago e Paulo. Ele registra fichas, sessões, séries, evolução, recuperação, fotos de progresso e dados corporais no Supabase, com escrita separada por usuário.

## O que já está disponível

- Fichas A–F pessoais, editáveis, duplicáveis, arquiváveis e reordenáveis.
- Execução de treino persistente, descanso, retomada, cancelamento e histórico.
- Biblioteca de exercícios pessoais, mídia própria e progresso por exercício.
- Histórico/calendário, evolução, medidas, recuperação e painel familiar somente-leitura.
- Fotos de progresso privadas por padrão, com compartilhamento por foto.
- Perfil, avatar, senha, encerramento global de sessões, preferências de descanso/avisos e exportação pessoal em JSON.
- PWA instalável e navegação móvel fixa.

## Executar localmente

1. Crie um projeto Supabase e aplique, em ordem, todos os arquivos de `supabase/migrations/`.
2. Provisione os três usuários em **Authentication > Users** e insira os respectivos perfis em `public.profiles` com o mesmo UUID de `auth.users`.
3. Copie `.env.example` para `.env.local` e informe somente a URL e a chave pública anônima.
4. Execute `npm install`, `npm run dev`.

O banco não permite ao cliente escolher o dono: as políticas usam a identidade autenticada de `auth.uid()`. A chave `service_role` nunca deve ser adicionada ao frontend.

## Verificações

`npm test` executa a suíte; `npm run build` produz o bundle de produção.

Consulte [arquitetura](ARCHITECTURE.md), [banco](DATABASE.md), [segurança](SECURITY.md), [testes](TESTING.md) e [deploy](DEPLOYMENT.md) para a operação do projeto.
