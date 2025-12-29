-- ================================================
-- TABELA DE GERAÇÕES DE PLANOS
-- Controla limite de 1 geração por tipo por mês
-- ================================================

-- Criar tabela
CREATE TABLE IF NOT EXISTS plan_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('home_workout', 'gym_workout', 'diet')),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content TEXT NOT NULL,
    -- Coluna auxiliar para controle mensal
    generation_month DATE GENERATED ALWAYS AS (DATE_TRUNC('month', generated_at)::DATE) STORED
);

-- Índice único para evitar duplicatas no mesmo mês
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_plan_per_month 
    ON plan_generations(user_id, plan_type, generation_month);

-- Outros índices
CREATE INDEX IF NOT EXISTS idx_plan_generations_user ON plan_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_generations_date ON plan_generations(generated_at);

-- Habilitar RLS
ALTER TABLE plan_generations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Usuários podem ver apenas suas próprias gerações
CREATE POLICY "Users can view own generations"
    ON plan_generations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias gerações
CREATE POLICY "Users can create own generations"
    ON plan_generations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE plan_generations IS 'Armazena gerações de planos (treino/dieta) dos usuários';
COMMENT ON COLUMN plan_generations.plan_type IS 'Tipo: home_workout, gym_workout, diet';
COMMENT ON COLUMN plan_generations.content IS 'Conteúdo do plano gerado';
COMMENT ON COLUMN plan_generations.generation_month IS 'Mês da geração para controle de unicidade';
