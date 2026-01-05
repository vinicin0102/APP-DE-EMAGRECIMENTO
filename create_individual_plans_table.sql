-- Criação da tabela individual_plans para o Plano Individual Mensal

-- 1. Criar a tabela
CREATE TABLE IF NOT EXISTS individual_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    peso DECIMAL(5,2) NOT NULL,
    meta_peso DECIMAL(5,2) NOT NULL,
    local_treino VARCHAR(50) NOT NULL,
    altura DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índice para buscar por usuário
CREATE INDEX IF NOT EXISTS idx_individual_plans_user_id ON individual_plans(user_id);

-- 3. Habilitar RLS
ALTER TABLE individual_plans ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acesso
-- Usuários podem ver apenas seus próprios planos
DROP POLICY IF EXISTS "Users can view own plans" ON individual_plans;
CREATE POLICY "Users can view own plans"
ON individual_plans FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar seus próprios planos
DROP POLICY IF EXISTS "Users can insert own plans" ON individual_plans;
CREATE POLICY "Users can insert own plans"
ON individual_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios planos
DROP POLICY IF EXISTS "Users can update own plans" ON individual_plans;
CREATE POLICY "Users can update own plans"
ON individual_plans FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_individual_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_individual_plans_updated_at ON individual_plans;
CREATE TRIGGER trigger_update_individual_plans_updated_at
BEFORE UPDATE ON individual_plans
FOR EACH ROW
EXECUTE FUNCTION update_individual_plans_updated_at();

SELECT 'Tabela individual_plans criada com sucesso!' as status;
