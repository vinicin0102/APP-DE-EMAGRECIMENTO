import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { User, Post, Challenge } from '../lib/supabase'
import './AdminPanel.css'

const ADMIN_EMAIL = 'admin@gmail.com'

interface Stats {
    totalUsers: number
    totalPosts: number
    totalChallenges: number
    activeUsers: number
}

export default function AdminPanel() {
    const { profile } = useAuth()
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'posts' | 'challenges' | 'lessons'>('dashboard')
    const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalPosts: 0, totalChallenges: 0, activeUsers: 0 })
    const [users, setUsers] = useState<User[]>([])
    const [posts, setPosts] = useState<(Post & { user?: User })[]>([])
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [loading, setLoading] = useState(true)

    // Modal states
    const [showChallengeModal, setShowChallengeModal] = useState(false)
    const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
    const [challengeForm, setChallengeForm] = useState({
        title: '',
        description: '',
        emoji: '🎯',
        color: '#00C853',
        duration_days: 7,
        difficulty: 'Fácil' as 'Fácil' | 'Intermediário' | 'Avançado',
        reward_points: 100
    })

    // Verificar se é admin
    const isAdmin = profile?.email === ADMIN_EMAIL

    useEffect(() => {
        if (isAdmin) {
            fetchData()
        }
    }, [isAdmin])

    const fetchData = async () => {
        setLoading(true)

        // Fetch stats
        const [usersRes, postsRes, challengesRes] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('posts').select('*, user:users(*)').order('created_at', { ascending: false }),
            supabase.from('challenges').select('*').order('created_at', { ascending: false })
        ])

        setUsers(usersRes.data || [])
        setPosts(postsRes.data || [])
        setChallenges(challengesRes.data || [])

        setStats({
            totalUsers: usersRes.data?.length || 0,
            totalPosts: postsRes.data?.length || 0,
            totalChallenges: challengesRes.data?.length || 0,
            activeUsers: usersRes.data?.filter(u => u.streak_days > 0).length || 0
        })

        setLoading(false)
    }

    // User actions
    const deleteUser = async (userId: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível.')) return
        await supabase.from('users').delete().eq('id', userId)
        fetchData()
    }

    const updateUserPoints = async (userId: string, points: number) => {
        await supabase.from('users').update({ points }).eq('id', userId)
        fetchData()
    }

    // Post actions
    const deletePost = async (postId: string) => {
        if (!confirm('Tem certeza que deseja excluir este post?')) return
        await supabase.from('posts').delete().eq('id', postId)
        fetchData()
    }

    // Challenge actions
    const openChallengeModal = (challenge?: Challenge) => {
        if (challenge) {
            setEditingChallenge(challenge)
            setChallengeForm({
                title: challenge.title,
                description: challenge.description,
                emoji: challenge.emoji,
                color: challenge.color,
                duration_days: challenge.duration_days,
                difficulty: challenge.difficulty,
                reward_points: challenge.reward_points
            })
        } else {
            setEditingChallenge(null)
            setChallengeForm({
                title: '',
                description: '',
                emoji: '🎯',
                color: '#00C853',
                duration_days: 7,
                difficulty: 'Fácil',
                reward_points: 100
            })
        }
        setShowChallengeModal(true)
    }

    const saveChallenge = async () => {
        const now = new Date()
        const endDate = new Date(now.getTime() + challengeForm.duration_days * 24 * 60 * 60 * 1000)

        if (editingChallenge) {
            await supabase.from('challenges').update({
                ...challengeForm,
                end_date: endDate.toISOString()
            }).eq('id', editingChallenge.id)
        } else {
            await supabase.from('challenges').insert({
                ...challengeForm,
                start_date: now.toISOString(),
                end_date: endDate.toISOString(),
                participants_count: 0
            })
        }

        setShowChallengeModal(false)
        fetchData()
    }

    const deleteChallenge = async (challengeId: string) => {
        if (!confirm('Tem certeza que deseja excluir este desafio?')) return
        await supabase.from('challenges').delete().eq('id', challengeId)
        fetchData()
    }

    if (!isAdmin) {
        return (
            <div className="admin-denied">
                <span>🔒</span>
                <h2>Acesso Negado</h2>
                <p>Você não tem permissão para acessar esta área.</p>
            </div>
        )
    }

    return (
        <div className="admin-panel">
            <header className="admin-header">
                <h1>⚙️ Painel Admin</h1>
                <span className="admin-badge">ADMIN</span>
            </header>

            {/* Tabs */}
            <div className="admin-tabs">
                <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
                    📊 Dashboard
                </button>
                <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
                    👥 Usuários
                </button>
                <button className={activeTab === 'posts' ? 'active' : ''} onClick={() => setActiveTab('posts')}>
                    📝 Posts
                </button>
                <button className={activeTab === 'challenges' ? 'active' : ''} onClick={() => setActiveTab('challenges')}>
                    🏆 Desafios
                </button>
            </div>

            <div className="admin-content">
                {loading ? (
                    <div className="admin-loading">Carregando...</div>
                ) : (
                    <>
                        {/* Dashboard */}
                        {activeTab === 'dashboard' && (
                            <div className="dashboard-section">
                                <div className="stats-cards">
                                    <div className="stat-card-admin">
                                        <span className="stat-icon">👥</span>
                                        <div>
                                            <span className="stat-number">{stats.totalUsers}</span>
                                            <span className="stat-label">Usuários</span>
                                        </div>
                                    </div>
                                    <div className="stat-card-admin">
                                        <span className="stat-icon">📝</span>
                                        <div>
                                            <span className="stat-number">{stats.totalPosts}</span>
                                            <span className="stat-label">Posts</span>
                                        </div>
                                    </div>
                                    <div className="stat-card-admin">
                                        <span className="stat-icon">🏆</span>
                                        <div>
                                            <span className="stat-number">{stats.totalChallenges}</span>
                                            <span className="stat-label">Desafios</span>
                                        </div>
                                    </div>
                                    <div className="stat-card-admin">
                                        <span className="stat-icon">🔥</span>
                                        <div>
                                            <span className="stat-number">{stats.activeUsers}</span>
                                            <span className="stat-label">Usuários Ativos</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="recent-activity">
                                    <h3>📋 Últimos Posts</h3>
                                    {posts.slice(0, 5).map(post => (
                                        <div key={post.id} className="activity-item">
                                            <span className="activity-user">{post.user?.name || 'Usuário'}</span>
                                            <span className="activity-text">{post.content.substring(0, 50)}...</span>
                                            <span className="activity-time">
                                                {new Date(post.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Users */}
                        {activeTab === 'users' && (
                            <div className="users-section">
                                <h3>👥 Gerenciar Usuários ({users.length})</h3>
                                <div className="admin-table">
                                    <div className="table-header">
                                        <span>Nome</span>
                                        <span>Email</span>
                                        <span>Pontos</span>
                                        <span>Streak</span>
                                        <span>Ações</span>
                                    </div>
                                    {users.map(user => (
                                        <div key={user.id} className="table-row">
                                            <span>{user.name}</span>
                                            <span className="email-cell">{user.email}</span>
                                            <span>
                                                <input
                                                    type="number"
                                                    value={user.points}
                                                    onChange={(e) => updateUserPoints(user.id, parseInt(e.target.value) || 0)}
                                                    className="points-input"
                                                />
                                            </span>
                                            <span>🔥 {user.streak_days}</span>
                                            <span className="actions-cell">
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => deleteUser(user.id)}
                                                    disabled={user.email === ADMIN_EMAIL}
                                                >
                                                    🗑️
                                                </button>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Posts */}
                        {activeTab === 'posts' && (
                            <div className="posts-section">
                                <h3>📝 Gerenciar Posts ({posts.length})</h3>
                                <div className="admin-table">
                                    <div className="table-header">
                                        <span>Autor</span>
                                        <span>Conteúdo</span>
                                        <span>Likes</span>
                                        <span>Data</span>
                                        <span>Ações</span>
                                    </div>
                                    {posts.map(post => (
                                        <div key={post.id} className="table-row">
                                            <span>{post.user?.name || 'Usuário'}</span>
                                            <span className="content-cell">{post.content.substring(0, 40)}...</span>
                                            <span>❤️ {post.likes_count}</span>
                                            <span>{new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
                                            <span className="actions-cell">
                                                <button className="btn-delete" onClick={() => deletePost(post.id)}>
                                                    🗑️
                                                </button>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Challenges */}
                        {activeTab === 'challenges' && (
                            <div className="challenges-section">
                                <div className="section-header-admin">
                                    <h3>🏆 Gerenciar Desafios ({challenges.length})</h3>
                                    <button className="btn-add" onClick={() => openChallengeModal()}>
                                        + Novo Desafio
                                    </button>
                                </div>
                                <div className="admin-table">
                                    <div className="table-header">
                                        <span>Emoji</span>
                                        <span>Título</span>
                                        <span>Duração</span>
                                        <span>Dificuldade</span>
                                        <span>Participantes</span>
                                        <span>Ações</span>
                                    </div>
                                    {challenges.map(challenge => (
                                        <div key={challenge.id} className="table-row">
                                            <span style={{ fontSize: '1.5rem' }}>{challenge.emoji}</span>
                                            <span>{challenge.title}</span>
                                            <span>{challenge.duration_days} dias</span>
                                            <span className={`difficulty ${challenge.difficulty.toLowerCase()}`}>
                                                {challenge.difficulty}
                                            </span>
                                            <span>👥 {challenge.participants_count}</span>
                                            <span className="actions-cell">
                                                <button className="btn-edit" onClick={() => openChallengeModal(challenge)}>
                                                    ✏️
                                                </button>
                                                <button className="btn-delete" onClick={() => deleteChallenge(challenge.id)}>
                                                    🗑️
                                                </button>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Challenge Modal */}
            {showChallengeModal && (
                <div className="modal-overlay" onClick={() => setShowChallengeModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowChallengeModal(false)}>×</button>
                        <h3>{editingChallenge ? 'Editar Desafio' : 'Novo Desafio'}</h3>

                        <div className="form-group">
                            <label>Título</label>
                            <input
                                type="text"
                                value={challengeForm.title}
                                onChange={e => setChallengeForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Nome do desafio"
                            />
                        </div>

                        <div className="form-group">
                            <label>Descrição</label>
                            <textarea
                                value={challengeForm.description}
                                onChange={e => setChallengeForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Descrição do desafio"
                                rows={3}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Emoji</label>
                                <input
                                    type="text"
                                    value={challengeForm.emoji}
                                    onChange={e => setChallengeForm(prev => ({ ...prev, emoji: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Cor</label>
                                <input
                                    type="color"
                                    value={challengeForm.color}
                                    onChange={e => setChallengeForm(prev => ({ ...prev, color: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Duração (dias)</label>
                                <input
                                    type="number"
                                    value={challengeForm.duration_days}
                                    onChange={e => setChallengeForm(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 7 }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Pontos</label>
                                <input
                                    type="number"
                                    value={challengeForm.reward_points}
                                    onChange={e => setChallengeForm(prev => ({ ...prev, reward_points: parseInt(e.target.value) || 100 }))}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Dificuldade</label>
                            <select
                                value={challengeForm.difficulty}
                                onChange={e => setChallengeForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                            >
                                <option value="Fácil">Fácil</option>
                                <option value="Intermediário">Intermediário</option>
                                <option value="Avançado">Avançado</option>
                            </select>
                        </div>

                        <button className="btn-primary btn-save-modal" onClick={saveChallenge}>
                            {editingChallenge ? 'Salvar Alterações' : 'Criar Desafio'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
