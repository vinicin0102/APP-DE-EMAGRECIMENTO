-- =====================================================
-- TABELAS PARA ROTINA/PROGRESSO DE SAÚDE
-- =====================================================

-- Tabela: daily_logs (check-ins diários)
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Checks diários
    ate_healthy BOOLEAN DEFAULT FALSE,
    trained BOOLEAN DEFAULT FALSE,
    drank_water BOOLEAN DEFAULT FALSE,
    
    -- Observações opcionais
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Único por usuário/data
    UNIQUE(user_id, log_date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(log_date);

-- RLS para daily_logs
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver próprios logs diários" ON daily_logs;
CREATE POLICY "Usuários podem ver próprios logs diários" ON daily_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar próprios logs diários" ON daily_logs;
CREATE POLICY "Usuários podem criar próprios logs diários" ON daily_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar próprios logs diários" ON daily_logs;
CREATE POLICY "Usuários podem atualizar próprios logs diários" ON daily_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- TABELAS PARA DESAFIOS PREMIUM
-- =====================================================

-- Tabela: challenge_purchases (compras de desafios)
CREATE TABLE IF NOT EXISTS challenge_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    challenge_id UUID NOT NULL,
    
    -- Informações da compra
    price_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Status do desafio
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    completed_at TIMESTAMPTZ,
    
    -- Único: cada usuário compra cada desafio uma vez
    UNIQUE(user_id, challenge_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_challenge_purchases_user ON challenge_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_purchases_challenge ON challenge_purchases(challenge_id);

-- RLS para challenge_purchases
ALTER TABLE challenge_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver próprias compras" ON challenge_purchases;
CREATE POLICY "Usuários podem ver próprias compras" ON challenge_purchases
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar próprias compras" ON challenge_purchases;
CREATE POLICY "Usuários podem criar próprias compras" ON challenge_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar próprias compras" ON challenge_purchases;
CREATE POLICY "Usuários podem atualizar próprias compras" ON challenge_purchases
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- TABELA: user_badges (conquistas/badges)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Informações do badge
    badge_type TEXT NOT NULL, -- 'challenge_completed', 'consistency_7', 'consistency_30', etc
    badge_name TEXT NOT NULL,
    badge_icon TEXT, -- emoji ou URL do ícone
    badge_description TEXT,
    
    -- Referência ao desafio (se aplicável)
    challenge_id UUID,
    
    -- Quando ganhou
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Evitar duplicatas
    UNIQUE(user_id, badge_type, challenge_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- RLS para user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ver badges" ON user_badges;
CREATE POLICY "Todos podem ver badges" ON user_badges
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Sistema pode criar badges" ON user_badges;
CREATE POLICY "Sistema pode criar badges" ON user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- ADICIONAR CAMPOS AOS DESAFIOS EXISTENTES
-- =====================================================

-- Adicionar campo is_premium e price aos challenges
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS badge_icon TEXT DEFAULT '🏆';
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS badge_name TEXT;

-- =====================================================
-- ATUALIZAR TABELA WEIGHT_LOGS (se não existir)
-- =====================================================

CREATE TABLE IF NOT EXISTS weight_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user ON weight_logs(user_id, logged_at DESC);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver próprios pesos" ON weight_logs;
CREATE POLICY "Usuários podem ver próprios pesos" ON weight_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar próprios pesos" ON weight_logs;
CREATE POLICY "Usuários podem criar próprios pesos" ON weight_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNÇÃO PARA CALCULAR CONSISTÊNCIA
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_consistency(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE(
    total_days INTEGER,
    days_with_all_checks INTEGER,
    consistency_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_days as total_days,
        COALESCE(COUNT(*)::INTEGER, 0) as days_with_all_checks,
        ROUND(COALESCE(COUNT(*)::DECIMAL / p_days * 100, 0), 1) as consistency_percentage
    FROM daily_logs
    WHERE user_id = p_user_id
      AND log_date >= CURRENT_DATE - (p_days - 1)
      AND ate_healthy = TRUE
      AND trained = TRUE
      AND drank_water = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
