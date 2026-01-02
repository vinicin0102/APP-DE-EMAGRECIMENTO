-- 1. Garante que as colunas existem na tabela de usuários
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS height numeric;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_date date;

-- 2. Garante que o bucket 'avatars' existe e é PÚBLICO
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Limpeza RADICAL de políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Avatares Publicos" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Upload Auth" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update Auth" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Delete Auth" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Avatars" ON storage.objects;

-- 4. Criação de novas políticas permissivas
-- Leitura: Qualquer pessoa pode ver a foto
CREATE POLICY "Public Access Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Escrita: Usuário logado pode fazer tudo no bucket avatars
CREATE POLICY "Auth Full Access Avatars"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Confirmação
SELECT 'Correção aplicada com sucesso! Tente o upload novamente.' as status;
