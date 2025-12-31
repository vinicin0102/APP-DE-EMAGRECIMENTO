-- =====================================================
-- ADICIONAR ID DO PRODUTO PARA INTEGRAÇÃO WEBHOOK
-- =====================================================
-- Este campo serve para mapear o produto do Gateway (Kiwify, Hotmart, MP)
-- com o desafio no seu aplicativo.
-- Ex: No Kiwify o produto tem ID "k123456", voce salva esse ID aqui.

ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS gateway_product_id TEXT;

COMMENT ON COLUMN challenges.gateway_product_id IS 'ID do produto na plataforma de pagamento (ex: Kiwify ID, Stripe ID) para integração via Webhook';

-- Criar tabela de log de vendas (opcional, mas recomendado para segurança)
CREATE TABLE IF NOT EXISTS sales_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    challenge_id UUID REFERENCES challenges(id),
    gateway_transaction_id TEXT,
    gateway_provider TEXT, -- 'kiwify', 'mercadopago', etc
    amount DECIMAL(10, 2),
    status TEXT, -- 'approved', 'refunded'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Desabilitar RLS na tabela de vendas para facilitar inserção via função
ALTER TABLE sales_history DISABLE ROW LEVEL SECURITY;
