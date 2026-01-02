-- Atualiza tabela users com novos campos de saúde
ALTER TABLE users ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Configuração do Storage para Avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Acesso (RLS) para o bucket avatars
-- Remove políticas antigas se existirem para evitar duplicidade ou conflito
DROP POLICY IF EXISTS "Avatares Publicos" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Upload Auth" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update Auth" ON storage.objects;

-- Leitura Pública
CREATE POLICY "Avatares Publicos" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Upload apenas para o próprio usuário (folder structure: avatars/user_id/filename)
-- Simplificando: permite qualquer insert autenticado para o bucket avatars
CREATE POLICY "Avatar Upload Auth" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Avatar Update Auth" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

CREATE POLICY "Avatar Delete Auth" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'avatars');
