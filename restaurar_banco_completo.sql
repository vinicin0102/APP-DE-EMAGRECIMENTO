-- =====================================================
-- SCRIPT COMPLETO DE RESTAURAÇÃO DO BANCO DE DADOS
-- =====================================================
-- Este script combina:
-- 1. supabase-setup.sql (Tabelas base: users, posts, challenges, etc)
-- 2. create_individual_plans_table.sql (Planos individuais)
-- 3. create_workouts_table.sql (Treinos e treinos do usuário)
-- 4. update_individual_plans_policies.sql (Permissões de admin)

-- =====================================================
-- PARTE 1: TABELAS BASE (supabase-setup.sql)
-- =====================================================

-- Tabela de usuários (perfis)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  weight_goal DECIMAL(5,2),
  current_weight DECIMAL(5,2),
  points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de posts da comunidade
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de desafios
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Fácil', 'Intermediário', 'Avançado')),
  reward_points INTEGER NOT NULL,
  participants_count INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de participantes de desafios
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id)
);

-- Tabela de registro de peso
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de likes
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Tabela de comentários
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FUNÇÕES RPC
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_participants(challenge_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE challenges SET participants_count = participants_count + 1 WHERE id = challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Anyone can view challenges" ON challenges;
DROP POLICY IF EXISTS "Anyone can view participants" ON challenge_participants;
DROP POLICY IF EXISTS "Authenticated users can join challenges" ON challenge_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON challenge_participants;
DROP POLICY IF EXISTS "Users can view own weight logs" ON weight_logs;
DROP POLICY IF EXISTS "Users can insert own weight logs" ON weight_logs;
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Authenticated users can like" ON likes;
DROP POLICY IF EXISTS "Users can remove own likes" ON likes;
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- Políticas para users
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para posts
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Políticas para challenges
CREATE POLICY "Anyone can view challenges" ON challenges FOR SELECT USING (true);

-- Políticas para challenge_participants
CREATE POLICY "Anyone can view participants" ON challenge_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join challenges" ON challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON challenge_participants FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para weight_logs
CREATE POLICY "Users can view own weight logs" ON weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weight logs" ON weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para likes
CREATE POLICY "Anyone can view likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Políticas para comments
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- DADOS INICIAIS - DESAFIOS
INSERT INTO challenges (title, description, emoji, color, duration_days, difficulty, reward_points, start_date, end_date, participants_count)
SELECT * FROM (VALUES
  ('Desafio 30 Dias Sem Açúcar', 'Elimine o açúcar refinado da sua alimentação por 30 dias.', '🍬', '#FF4081', 30, 'Intermediário', 500, NOW(), NOW() + INTERVAL '30 days', 2340),
  ('10.000 Passos Diários', 'Caminhe pelo menos 10.000 passos todos os dias.', '👟', '#00C853', 21, 'Fácil', 300, NOW(), NOW() + INTERVAL '21 days', 5120),
  ('Jejum Intermitente 16:8', 'Pratique o jejum intermitente de 16 horas por dia.', '⏰', '#7C4DFF', 14, 'Avançado', 400, NOW(), NOW() + INTERVAL '14 days', 1890),
  ('Hidratação Total', 'Beba pelo menos 2 litros de água por dia.', '💧', '#2979FF', 7, 'Fácil', 150, NOW(), NOW() + INTERVAL '7 days', 8750)
) AS v(title, description, emoji, color, duration_days, difficulty, reward_points, start_date, end_date, participants_count)
WHERE NOT EXISTS (SELECT 1 FROM challenges LIMIT 1);


-- =====================================================
-- PARTE 2: PLANOS INDIVIDUAIS
-- =====================================================

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

CREATE INDEX IF NOT EXISTS idx_individual_plans_user_id ON individual_plans(user_id);
ALTER TABLE individual_plans ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION update_individual_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_individual_plans_updated_at ON individual_plans;
CREATE TRIGGER trigger_update_individual_plans_updated_at
BEFORE UPDATE ON individual_plans
FOR EACH ROW
EXECUTE FUNCTION update_individual_plans_updated_at();

-- =====================================================
-- PARTE 3: TREINOS (WORKOUTS)
-- =====================================================

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

CREATE INDEX IF NOT EXISTS idx_workouts_type ON workouts(type);
CREATE INDEX IF NOT EXISTS idx_workouts_active ON workouts(is_active);
CREATE INDEX IF NOT EXISTS idx_user_workouts_user ON user_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workouts_month ON user_workouts(plan_month);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workouts ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de Workouts
DROP POLICY IF EXISTS "Authenticated can view workouts" ON workouts;
CREATE POLICY "Authenticated can view workouts" ON workouts FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated can insert workouts" ON workouts;
CREATE POLICY "Authenticated can insert workouts" ON workouts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated can update workouts" ON workouts;
CREATE POLICY "Authenticated can update workouts" ON workouts FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated can delete workouts" ON workouts;
CREATE POLICY "Authenticated can delete workouts" ON workouts FOR DELETE USING (auth.role() = 'authenticated');

-- Inserir treinos de exemplo
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


-- =====================================================
-- PARTE 4: ATUALIZAÇÃO DE PERMISSÕES ADICIONAIS (ADMIN)
-- =====================================================

-- 1. Políticas atualizadas para individual_plans
DROP POLICY IF EXISTS "Users can view own plans" ON individual_plans;
DROP POLICY IF EXISTS "Users can insert own plans" ON individual_plans;
DROP POLICY IF EXISTS "Users can update own plans" ON individual_plans;
DROP POLICY IF EXISTS "Admins can view all plans" ON individual_plans;
DROP POLICY IF EXISTS "Admins can update all plans" ON individual_plans;

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

CREATE POLICY "Users can insert own plans"
ON individual_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

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

-- 2. Políticas atualizadas para user_workouts
DROP POLICY IF EXISTS "Admins can manage user workouts" ON user_workouts;
DROP POLICY IF EXISTS "System insert user workouts" ON user_workouts;
DROP POLICY IF EXISTS "Admins can delete user workouts" ON user_workouts;
DROP POLICY IF EXISTS "Users view own workouts" ON user_workouts;

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
