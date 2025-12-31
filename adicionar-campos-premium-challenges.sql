-- =====================================================
-- ADICIONAR CAMPOS PREMIUM E PREÇO NA TABELA CHALLENGES
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Painel: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

-- Adicionar coluna is_premium (booleano, default false)
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Adicionar coluna price (decimal para valores monetários)
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0.00;

-- Comentários nas colunas para documentação
COMMENT ON COLUMN challenges.is_premium IS 'Indica se o desafio é premium (pago) ou gratuito';
COMMENT ON COLUMN challenges.price IS 'Preço do desafio em Reais (R$). 0 = gratuito ou incluído no plano Diamond';

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'challenges' 
AND column_name IN ('is_premium', 'price');
