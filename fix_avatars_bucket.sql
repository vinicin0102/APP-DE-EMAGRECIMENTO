-- ============================================
-- SCRIPT PARA CORRIGIR STORAGE DE AVATARS
-- ============================================
-- 
-- IMPORTANTE: Antes de rodar este script, 
-- você PRECISA criar o bucket manualmente:
--
-- 1. Vá em Supabase Dashboard > Storage
-- 2. Clique em "New Bucket"
-- 3. Nome: avatars
-- 4. Marque "Public bucket" ✓
-- 5. Clique em "Save"
--
-- Depois de criar o bucket, rode este script:
-- ============================================

-- Remover todas as políticas antigas do bucket avatars
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END $$;

-- Política 1: Qualquer pessoa pode VER avatars
CREATE POLICY "avatars_public_view"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Política 2: Usuários autenticados podem fazer UPLOAD de avatars
CREATE POLICY "avatars_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- Política 3: Usuários autenticados podem ATUALIZAR avatars
CREATE POLICY "avatars_auth_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Política 4: Usuários autenticados podem DELETAR avatars
CREATE POLICY "avatars_auth_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

SELECT 'Políticas de storage configuradas!' as status;
