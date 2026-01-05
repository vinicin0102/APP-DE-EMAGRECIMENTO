-- ============================================
-- TABELA DE TREINOS PARA PLANO INDIVIDUAL
-- Versão que remove políticas antigas primeiro
-- ============================================

-- 1. Criar tabela de treinos (se não existir)
CREATE TABLE IF NOT EXISTS workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('casa', 'academia', 'ambos')),
    duration VARCHAR(50),
    difficulty VARCHAR(50) CHECK (difficulty IN ('iniciante', 'intermediario', 'avancado')),
    exercises JSONB,
    video_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de treinos atribuídos aos usuários (se não existir)
CREATE TABLE IF NOT EXISTS user_workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    plan_month DATE NOT NULL,
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

-- 5. REMOVER políticas antigas (se existirem)
DROP POLICY IF EXISTS "Anyone can view active workouts" ON workouts;
DROP POLICY IF EXISTS "Service role full access workouts" ON workouts;
DROP POLICY IF EXISTS "Authenticated can view workouts" ON workouts;
DROP POLICY IF EXISTS "Authenticated can insert workouts" ON workouts;
DROP POLICY IF EXISTS "Authenticated can update workouts" ON workouts;
DROP POLICY IF EXISTS "Authenticated can delete workouts" ON workouts;

DROP POLICY IF EXISTS "Users view own workouts" ON user_workouts;
DROP POLICY IF EXISTS "Users update own workouts" ON user_workouts;
DROP POLICY IF EXISTS "System insert user workouts" ON user_workouts;

-- 6. Criar novas políticas para workouts
CREATE POLICY "Authenticated can view workouts"
ON workouts FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert workouts"
ON workouts FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update workouts"
ON workouts FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete workouts"
ON workouts FOR DELETE
USING (auth.role() = 'authenticated');

-- 7. Políticas para user_workouts
CREATE POLICY "Users view own workouts"
ON user_workouts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users update own workouts"
ON user_workouts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System insert user workouts"
ON user_workouts FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 8. Inserir treinos de exemplo (se a tabela estiver vazia)
INSERT INTO workouts (title, description, type, duration, difficulty, exercises) 
SELECT * FROM (VALUES
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
) AS v(title, description, type, duration, difficulty, exercises)
WHERE NOT EXISTS (SELECT 1 FROM workouts LIMIT 1);

SELECT 'Tabelas de treinos configuradas com sucesso!' as status;
