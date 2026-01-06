-- ============================================
-- ATUALIZAÇÃO DE POLÍTICAS PARA PLANOS INDIVIDUAIS
-- Permite que admins vejam todos os planos
-- ============================================

-- 1. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view own plans" ON individual_plans;
DROP POLICY IF EXISTS "Users can insert own plans" ON individual_plans;
DROP POLICY IF EXISTS "Users can update own plans" ON individual_plans;
DROP POLICY IF EXISTS "Admins can view all plans" ON individual_plans;
DROP POLICY IF EXISTS "Admins can update all plans" ON individual_plans;

-- 2. Criar política para usuários verem seus próprios planos
CREATE POLICY "Users can view own plans"
ON individual_plans FOR SELECT
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.email IN ('admin@gmail.com', 'vv9250400@gmail.com')
    )
);

-- 3. Usuários podem criar seus próprios planos
CREATE POLICY "Users can insert own plans"
ON individual_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Usuários podem atualizar seus próprios planos OU admins podem atualizar qualquer plano
CREATE POLICY "Users can update own plans"
ON individual_plans FOR UPDATE
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.email IN ('admin@gmail.com', 'vv9250400@gmail.com')
    )
)
WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.email IN ('admin@gmail.com', 'vv9250400@gmail.com')
    )
);

-- 5. Atualizar políticas de user_workouts para admins também
DROP POLICY IF EXISTS "Admins can manage user workouts" ON user_workouts;
DROP POLICY IF EXISTS "System insert user workouts" ON user_workouts;

CREATE POLICY "System insert user workouts"
ON user_workouts FOR INSERT
WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.email IN ('admin@gmail.com', 'vv9250400@gmail.com')
    )
);

-- Admins podem deletar user_workouts
DROP POLICY IF EXISTS "Admins can delete user workouts" ON user_workouts;
CREATE POLICY "Admins can delete user workouts"
ON user_workouts FOR DELETE
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.email IN ('admin@gmail.com', 'vv9250400@gmail.com')
    )
);

-- Admins podem ver todos os user_workouts
DROP POLICY IF EXISTS "Users view own workouts" ON user_workouts;
CREATE POLICY "Users view own workouts"
ON user_workouts FOR SELECT
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.email IN ('admin@gmail.com', 'vv9250400@gmail.com')
    )
);

SELECT 'Políticas de individual_plans e user_workouts atualizadas com sucesso!' as status;
