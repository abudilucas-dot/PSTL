# Arquitetura do PSTL

O frontend é React + TypeScript empacotado com Vite. As telas ficam em `src/features/`; regras de cálculo e validação testáveis ficam em `src/lib/`.

O navegador usa somente a URL e a chave pública do Supabase. A identidade vem da sessão do Supabase Auth; não existe chave de serviço, nem escolha de `owner_id` feita pelo usuário. Dados persistentes ficam no PostgreSQL e arquivos privados no Supabase Storage.

As operações de treino são gravadas em sessão, exercícios da sessão e séries. A ficha é copiada como snapshot ao iniciar o treino, então edições posteriores nunca modificam o histórico.

O aplicativo usa carregamento sob demanda para Evolução, Biblioteca, Família, Recuperação e Perfil. O service worker em `public/sw.js` mantém os recursos estáticos e permite que a rota principal abra sem rede depois de visitada.
