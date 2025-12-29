-- ================================================
-- ADICIONAR CAMPOS DE BAN NA TABELA USERS
-- Execute este SQL no Supabase SQL Editor
-- ================================================

-- Adicionar campo: ban permanente
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Adicionar campo: ban temporário com data de expiração
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Adicionar campo: ban apenas do feed
ALTER TABLE users ADD COLUMN IF NOT EXISTS feed_banned_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Adicionar campo: usuário mutado (não pode postar/comentar)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;

-- Adicionar campo: mudo com data de expiração
ALTER TABLE users ADD COLUMN IF NOT EXISTS muted_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Adicionar campo: motivo do ban
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT DEFAULT NULL;

-- ================================================
-- VERIFICAR SE COLUNAS FORAM CRIADAS
-- ================================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('is_banned', 'banned_until', 'feed_banned_until', 'is_muted', 'muted_until', 'ban_reason');
