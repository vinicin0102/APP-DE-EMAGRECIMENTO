-- =====================================================
-- ADICIONAR CAMPO CHECKOUT URL NA TABELA CHALLENGES
-- =====================================================
-- Execute este script no Supabase SQL Editor para permitir
-- salvar links de pagamento externos (Mercado Pago, Stripe, etc)

-- Adicionar coluna checkout_url (texto opcional)
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS checkout_url TEXT;

-- Comentário na coluna
COMMENT ON COLUMN challenges.checkout_url IS 'Link para checkout externo (Mercado Pago, Stripe, Kiwify) para desafios premium';

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'challenges' 
AND column_name = 'checkout_url';
