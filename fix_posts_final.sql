-- Solução Definitiva para Imagens dos Posts

-- 1. Força o bucket a ser público (Fundamental para visualizar imagens)
UPDATE storage.buckets
SET public = true
WHERE id = 'posts-images';

-- 2. Insere se não existir (garantia)
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts-images', 'posts-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Limpeza de TODAS as políticas relacionadas (incluindo possíveis typos)
DROP POLICY IF EXISTS "Public Access Posts" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Posts" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Postas" ON storage.objects; -- Removendo o typo
DROP POLICY IF EXISTS "Auth Update Posts" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Posts" ON storage.objects;
DROP POLICY IF EXISTS "Post Images Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Post Images Upload" ON storage.objects;
DROP POLICY IF EXISTS "Post Images Update" ON storage.objects;
DROP POLICY IF EXISTS "Post Images Delete" ON storage.objects;
DROP POLICY IF EXISTS "Auth Full Access Posts" ON storage.objects;

-- 4. Política SIMPLES e PERMISSIVA
-- Permitir visualização pública
CREATE POLICY "Public View Posts"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts-images');

-- Permitir tudo para usuários logados (Upload, Delete, Update)
CREATE POLICY "Authenticated Full Access"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'posts-images')
WITH CHECK (bucket_id = 'posts-images');

SELECT 'Permissões corrigidas. Tente recarregar a página.' as status;
