-- =====================================================
-- SCRIPT PARA CRIAR TABELA DE GATEWAYS DE PAGAMENTO
-- =====================================================
-- Execute este script no Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS payment_gateways (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,                -- Ex: "Kiwify", "Hotmart", "Stripe"
    webhook_url TEXT NOT NULL,         -- URL que o gateway deve chamar
    secret TEXT,                       -- Token/Secret para validar o webhook (opcional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atualiza timestamp automaticamente
CREATE OR REPLACE FUNCTION update_payment_gateways_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_payment_gateways_timestamp
BEFORE UPDATE ON payment_gateways
FOR EACH ROW EXECUTE FUNCTION update_payment_gateways_timestamp();

-- Desabilitar RLS (para facilitar o desenvolvimento)
ALTER TABLE payment_gateways DISABLE ROW LEVEL SECURITY;

SELECT 'Tabela payment_gateways criada com sucesso' AS status;
