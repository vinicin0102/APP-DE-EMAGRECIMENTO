-- Script para criar/corrigir o bucket de avatars e suas permissões

-- 1. Criar o bucket se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880;

-- 2. Remover políticas antigas
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

-- 3. Política para visualização pública
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 4. Política para upload (usuários autenticados)
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- 5. Política para atualização
CREATE POLICY "Users can update avatars"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- 6. Política para deleção
CREATE POLICY "Users can delete avatars"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

SELECT 'Bucket avatars configurado com sucesso!' as status;
