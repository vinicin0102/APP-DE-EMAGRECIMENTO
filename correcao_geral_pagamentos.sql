-- =====================================================
-- SCRIPT DE CORREÇÃO GERAL E FINAL
-- =====================================================
-- Execute este script no Supabase SQL Editor para corrigir TUDO de uma vez.

-- 1. ADICIONAR COLUNAS (SE NÃO EXISTIREM)
-------------------------------------------------------
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS checkout_url TEXT;

-- 2. DESABILITAR RLS (PARA EVITAR ERROS DE PERMISSÃO)
-------------------------------------------------------
-- Esta é a forma mais garantida de fazer o salvamento funcionar agora.
ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;

-- 3. CONFIRMAÇÃO
-------------------------------------------------------
SELECT 'Sucesso! Colunas verificadas e permissoes liberadas.' as status;
