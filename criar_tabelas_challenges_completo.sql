-- =====================================================
-- CRIAR TABELAS DE DESAFIOS (COMPLETO)
-- =====================================================
-- Execute este script se receber erro de que a tabela "challenges" não existe.

-- 1. Criar tabela challenges
CREATE TABLE IF NOT EXISTS challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    emoji TEXT DEFAULT '🎯',
    color TEXT DEFAULT '#00C853',
    duration_days INTEGER DEFAULT 7,
    difficulty TEXT DEFAULT 'Fácil',
    reward_points INTEGER DEFAULT 100,
    participants_count INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Campos Premium
    is_premium BOOLEAN DEFAULT false,
    price DECIMAL(10, 2) DEFAULT 0.00,
    checkout_url TEXT
);

-- 2. Criar tabela de participantes (relação usuário <-> desafio)
CREATE TABLE IF NOT EXISTS challenge_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, challenge_id)
);

-- 3. Desabilitar RLS nas tabelas para evitar erros de permissão
ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants DISABLE ROW LEVEL SECURITY;

-- 4. Função para incrementar contagem de participantes (usada no código)
CREATE OR REPLACE FUNCTION increment_participants(challenge_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE challenges
  SET participants_count = participants_count + 1
  WHERE id = challenge_id;
END;
$$ LANGUAGE plpgsql;

SELECT 'Tabelas criadas com sucesso!' as status;
