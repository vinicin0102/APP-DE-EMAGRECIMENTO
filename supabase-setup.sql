-- =====================================================
-- SLIMFIT - SCRIPT DE CRIAÇÃO DAS TABELAS (v2)
-- Execute este script no SQL Editor do Supabase
-- Este script remove políticas existentes antes de recriar
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

-- =====================================================
-- FUNÇÕES RPC
-- =====================================================

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

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

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

-- =====================================================
-- DADOS INICIAIS - DESAFIOS (apenas se não existirem)
-- =====================================================

INSERT INTO challenges (title, description, emoji, color, duration_days, difficulty, reward_points, start_date, end_date, participants_count)
SELECT * FROM (VALUES
  ('Desafio 30 Dias Sem Açúcar', 'Elimine o açúcar refinado da sua alimentação por 30 dias.', '🍬', '#FF4081', 30, 'Intermediário', 500, NOW(), NOW() + INTERVAL '30 days', 2340),
  ('10.000 Passos Diários', 'Caminhe pelo menos 10.000 passos todos os dias.', '👟', '#00C853', 21, 'Fácil', 300, NOW(), NOW() + INTERVAL '21 days', 5120),
  ('Jejum Intermitente 16:8', 'Pratique o jejum intermitente de 16 horas por dia.', '⏰', '#7C4DFF', 14, 'Avançado', 400, NOW(), NOW() + INTERVAL '14 days', 1890),
  ('Hidratação Total', 'Beba pelo menos 2 litros de água por dia.', '💧', '#2979FF', 7, 'Fácil', 150, NOW(), NOW() + INTERVAL '7 days', 8750)
) AS v(title, description, emoji, color, duration_days, difficulty, reward_points, start_date, end_date, participants_count)
WHERE NOT EXISTS (SELECT 1 FROM challenges LIMIT 1);
