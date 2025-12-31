-- =====================================================
-- CORRIGIR PERMISSÕES DA TABELA CHALLENGES
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Este script configura as políticas RLS para permitir
-- que o admin crie, edite e delete desafios

-- 1. Primeiro, verificar se RLS está habilitado
-- Se você quiser DESABILITAR RLS temporariamente para testar:
-- ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;

-- 2. Criar políticas de acesso (mantendo RLS habilitado)

-- Política para SELECT (todos podem ver desafios)
DROP POLICY IF EXISTS "Todos podem ver desafios" ON challenges;
CREATE POLICY "Todos podem ver desafios" ON challenges
    FOR SELECT USING (true);

-- Política para INSERT (usuários autenticados podem criar)
DROP POLICY IF EXISTS "Usuários autenticados podem criar desafios" ON challenges;
CREATE POLICY "Usuários autenticados podem criar desafios" ON challenges
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE (usuários autenticados podem atualizar)
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar desafios" ON challenges;
CREATE POLICY "Usuários autenticados podem atualizar desafios" ON challenges
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para DELETE (usuários autenticados podem deletar)
DROP POLICY IF EXISTS "Usuários autenticados podem deletar desafios" ON challenges;
CREATE POLICY "Usuários autenticados podem deletar desafios" ON challenges
    FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Garantir que RLS está habilitado
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- 4. Verificar as políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'challenges';

-- =====================================================
-- ALTERNATIVA: DESABILITAR RLS COMPLETAMENTE (mais fácil)
-- =====================================================
-- Se as políticas acima não funcionarem, descomente a linha abaixo
-- para desabilitar RLS completamente na tabela challenges:

-- ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;
