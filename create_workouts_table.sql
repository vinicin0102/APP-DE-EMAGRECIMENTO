-- ============================================
-- TABELA DE TREINOS PARA PLANO INDIVIDUAL
-- ============================================

-- 1. Criar tabela de treinos
CREATE TABLE IF NOT EXISTS workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('casa', 'academia', 'ambos')),
    duration VARCHAR(50), -- Ex: "30 min", "45 min"
    difficulty VARCHAR(50) CHECK (difficulty IN ('iniciante', 'intermediario', 'avancado')),
    exercises JSONB, -- Array de exercícios com nome, séries, repetições
    video_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de treinos atribuídos aos usuários
CREATE TABLE IF NOT EXISTS user_workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Seg, 7=Dom
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    plan_month DATE NOT NULL, -- Mês/Ano do plano (primeiro dia do mês)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, day_of_week, plan_month)
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_workouts_type ON workouts(type);
CREATE INDEX IF NOT EXISTS idx_workouts_active ON workouts(is_active);
CREATE INDEX IF NOT EXISTS idx_user_workouts_user ON user_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workouts_month ON user_workouts(plan_month);

-- 4. Habilitar RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workouts ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para workouts (treinos)
-- Todos podem ver treinos ativos
CREATE POLICY "Anyone can view active workouts"
ON workouts FOR SELECT
USING (is_active = true);

-- Apenas admins podem gerenciar (via service role no admin)
CREATE POLICY "Service role full access workouts"
ON workouts FOR ALL
USING (auth.role() = 'service_role');

-- 6. Políticas para user_workouts
-- Usuários veem apenas seus próprios treinos
CREATE POLICY "Users view own workouts"
ON user_workouts FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios treinos (marcar como completo)
CREATE POLICY "Users update own workouts"
ON user_workouts FOR UPDATE
USING (auth.uid() = user_id);

-- Sistema pode inserir treinos para usuários
CREATE POLICY "System insert user workouts"
ON user_workouts FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 7. Função para sortear treinos
CREATE OR REPLACE FUNCTION generate_user_workout_plan(
    p_user_id UUID,
    p_workout_type VARCHAR(50),
    p_plan_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)
)
RETURNS JSONB AS $$
DECLARE
    v_workouts UUID[];
    v_workout_id UUID;
    v_day INTEGER;
    v_result JSONB := '[]'::JSONB;
BEGIN
    -- Deletar plano existente do mesmo mês
    DELETE FROM user_workouts 
    WHERE user_id = p_user_id 
    AND plan_month = p_plan_month;
    
    -- Buscar treinos disponíveis (do tipo do usuário ou "ambos")
    SELECT ARRAY_AGG(id) INTO v_workouts
    FROM workouts 
    WHERE is_active = true 
    AND (type = p_workout_type OR type = 'ambos');
    
    -- Se não há treinos, retornar vazio
    IF v_workouts IS NULL OR array_length(v_workouts, 1) IS NULL THEN
        RETURN '{"error": "Nenhum treino disponível"}'::JSONB;
    END IF;
    
    -- Atribuir um treino aleatório para cada dia da semana (Seg-Sáb = 1-6)
    FOR v_day IN 1..6 LOOP
        -- Sortear um treino aleatório
        v_workout_id := v_workouts[1 + floor(random() * array_length(v_workouts, 1))::int];
        
        -- Inserir na tabela
        INSERT INTO user_workouts (user_id, workout_id, day_of_week, plan_month)
        VALUES (p_user_id, v_workout_id, v_day, p_plan_month);
        
        -- Adicionar ao resultado
        v_result := v_result || jsonb_build_object(
            'day', v_day,
            'workout_id', v_workout_id
        );
    END LOOP;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Inserir alguns treinos de exemplo
INSERT INTO workouts (title, description, type, duration, difficulty, exercises) VALUES
(
    'Treino HIIT em Casa',
    'Treino intenso de alta intensidade para queimar gordura',
    'casa',
    '25 min',
    'intermediario',
    '[{"nome": "Polichinelos", "series": 3, "repeticoes": "30 seg"}, {"nome": "Burpees", "series": 3, "repeticoes": "10x"}, {"nome": "Mountain Climbers", "series": 3, "repeticoes": "30 seg"}]'::JSONB
),
(
    'Treino de Pernas - Casa',
    'Fortalecimento de pernas sem equipamentos',
    'casa',
    '30 min',
    'iniciante',
    '[{"nome": "Agachamento", "series": 4, "repeticoes": "15x"}, {"nome": "Afundo", "series": 3, "repeticoes": "12x cada"}, {"nome": "Ponte de Glúteos", "series": 3, "repeticoes": "15x"}]'::JSONB
),
(
    'Treino Superior - Academia',
    'Peito, ombros e tríceps',
    'academia',
    '45 min',
    'intermediario',
    '[{"nome": "Supino Reto", "series": 4, "repeticoes": "12x"}, {"nome": "Desenvolvimento", "series": 3, "repeticoes": "10x"}, {"nome": "Tríceps Corda", "series": 3, "repeticoes": "12x"}]'::JSONB
),
(
    'Treino Inferior - Academia',
    'Quadríceps, posterior e glúteos',
    'academia',
    '50 min',
    'intermediario',
    '[{"nome": "Leg Press", "series": 4, "repeticoes": "12x"}, {"nome": "Cadeira Extensora", "series": 3, "repeticoes": "12x"}, {"nome": "Stiff", "series": 3, "repeticoes": "10x"}]'::JSONB
),
(
    'Cardio + Core',
    'Treino cardiovascular com fortalecimento do core',
    'ambos',
    '35 min',
    'iniciante',
    '[{"nome": "Caminhada/Esteira", "series": 1, "repeticoes": "15 min"}, {"nome": "Prancha", "series": 3, "repeticoes": "30 seg"}, {"nome": "Abdominal", "series": 3, "repeticoes": "20x"}]'::JSONB
)
ON CONFLICT DO NOTHING;

SELECT 'Tabelas de treinos criadas com sucesso!' as status;
