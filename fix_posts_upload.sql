-- Script para corrigir e configurar o upload de imagens nos posts

-- 1. Cria o bucket 'posts-images' se não existir e garante que é público
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts-images', 'posts-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Limpeza de políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public Access Posts" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Posts" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update Posts" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Posts" ON storage.objects;
DROP POLICY IF EXISTS "Post Images Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Post Images Upload" ON storage.objects;
DROP POLICY IF EXISTS "Post Images Update" ON storage.objects;
DROP POLICY IF EXISTS "Post Images Delete" ON storage.objects;

-- 3. Criação de novas políticas
-- Leitura: Qualquer pessoa pode ver as imagens
CREATE POLICY "Public Access Posts"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts-images');

-- Escrita/Modificação: Usuário autenticado pode fazer tudo no bucket
-- (Mais permissivo para garantir funcionamento, depois pode ser restrito se necessário)
CREATE POLICY "Auth Full Access Posts"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'posts-images')
WITH CHECK (bucket_id = 'posts-images');

SELECT 'Bucket posts-images configurado com sucesso!' as status;
