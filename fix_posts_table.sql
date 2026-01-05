-- Correção de Permissões para Tabela de Posts
-- Rode isso se receber erro "Permission denied" ao postar

-- 1. Habilita RLS na tabela posts (se não estiver)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 2. Limpa políticas antigas de post
DROP POLICY IF EXISTS "Posts podem ser criados por usuarios autenticados" ON posts;
DROP POLICY IF EXISTS "Posts podem ser vistos por todos" ON posts;
DROP POLICY IF EXISTS "Authenticated Insert Posts" ON posts;
DROP POLICY IF EXISTS "Public Select Posts" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;

-- 3. Cria políticas permissivas
-- Permitir INSERT para qualquer usuário LOGADO
CREATE POLICY "Authenticated Insert Posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir SELECT para TODOS (público ou logado)
CREATE POLICY "Public Select Posts"
ON posts FOR SELECT
USING (true);

-- Permitir UPDATE apenas para o dono
CREATE POLICY "Owner Update Posts"
ON posts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir DELETE apenas para o dono
CREATE POLICY "Owner Delete Posts"
ON posts FOR DELETE
USING (auth.uid() = user_id);

SELECT 'Tabela posts configurada com sucesso!' as status;
