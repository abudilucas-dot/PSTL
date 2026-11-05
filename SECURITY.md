# Segurança

- Use apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no frontend. Nunca publique `service_role`.
- O login é processado pelo Supabase Auth. Senhas não são armazenadas no PSTL.
- RLS impede criar, editar ou excluir registros de outro perfil, mesmo por chamadas manuais à API.
- A leitura familiar é limitada a dados explicitamente permitidos pelas políticas; fotos de progresso só são visíveis quando o proprietário as compartilha.
- Os buckets de mídia são privados. O upload e a exclusão exigem pasta com o UUID autenticado.
- A alteração de senha pede a senha atual. O encerramento global de sessões usa `signOut({ scope: 'global' })`.

No plano gratuito, a proteção contra senhas vazadas pode estar indisponível. Quando houver plano compatível, ative-a em **Authentication → Sign In / Providers → Email**. Isso é uma melhoria adicional; não substitui as políticas RLS existentes.
