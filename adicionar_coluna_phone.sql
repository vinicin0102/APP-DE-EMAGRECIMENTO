-- ================================================
-- SCRIPT PARA ADICIONAR COLUNA DE CELULAR (PHONE)
-- Execute este script no Editor SQL do Supabase
-- ================================================

-- Adicionar coluna phone na tabela users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Comentário na coluna
COMMENT ON COLUMN public.users.phone IS 'Número de celular do usuário para contato';

-- Criar índice para busca por telefone (opcional, mas útil)
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- Mostrar confirmação
SELECT 'Coluna phone adicionada com sucesso!' AS resultado;

-- Verificar se a coluna foi criada
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'phone';
