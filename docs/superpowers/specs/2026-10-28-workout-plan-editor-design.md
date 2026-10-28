# Editor de fichas de treino — design

## Intenção

Entregar uma primeira versão utilizável do PSTL que permita a Lucas, Tiago e Paulo administrar exclusivamente as próprias fichas de treino, com dados persistidos no Supabase. As fichas A–F passam a ser sementes pessoais, não modelos compartilhados.

## Objetivos

- Autenticar usuários via Supabase e aplicar isolamento de escrita no banco.
- Criar, editar, duplicar, arquivar e excluir fichas pessoais.
- Editar todos os campos de cada exercício, inserir/remover/substituir e reordenar por toque ou mouse.
- Criar exercícios pessoais e enviar mídia própria ao Storage.
- Preservar sessões concluídas como snapshots imutáveis da ficha naquele momento.

## Fora de escopo desta fatia

- Acesso sem senha, gestão de dispositivos e o restante do dashboard/histórico avançado do prompt mestre. Eles exigem provisão/administração segura no Supabase e serão implementados em etapas posteriores.

## Abordagens consideradas

1. Guardar fichas no navegador: rejeitada, pois não fornece persistência real nem RLS.
2. Um modelo comum alterável: rejeitada, pois conflita com a independência exigida entre familiares.
3. Fichas e exercícios por proprietário, com RLS e snapshot de sessão: escolhida. Mantém isolamento no banco e histórico fiel após alterações.

## Arquitetura escolhida

React/Vite/TypeScript consome a API Supabase com sessão autenticada. A migração cria planos, itens, exercícios e snapshots; cada tabela operável verifica `auth.uid()` contra seu proprietário, enquanto referências dos itens são verificadas pelo plano pai. A UI usa React Hook Form/Zod, TanStack Query e dnd-kit; uploads entram em um bucket privado cujo caminho começa pelo UUID do dono.

## Decisões

- "Excluir" é exclusão lógica (`deleted_at`), evitando apagar fichas acidentalmente.
- Arquivamento é independente da exclusão lógica.
- A ficha inicial é semeada por função SQL somente para perfis já provisionados; o cliente nunca escolhe o proprietário.
- A confirmação de salvamento só aparece após a mutação Supabase retornar com sucesso.
