import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { User, Post, Challenge } from '../lib/supabase'
import './AdminPanel.css'

const ADMIN_EMAIL = 'admin@gmail.com'

interface Lesson {
    id: string
    title: string
    description: string
    duration: string
    thumbnail: string
    category: string
    videoUrl: string
    order: number
}

interface AppSettings {
    appName: string
    welcomeTitle: string
    welcomeSubtitle: string
    primaryColor: string
    secondaryColor: string
}

interface AIResponse {
    id: string
    keyword: string
    response: string
}

const defaultLessons: Lesson[] = [
    { id: '1', title: 'Introdução ao Emagrecimento', description: 'Aprenda os fundamentos', duration: '15 min', thumbnail: '🎯', category: 'Fundamentos', videoUrl: '', order: 1 },
    { id: '2', title: 'Déficit Calórico', description: 'Como funciona a perda de peso', duration: '20 min', thumbnail: '📊', category: 'Fundamentos', videoUrl: '', order: 2 },
    { id: '3', title: 'Montando seu Prato', description: 'Equilibrando macros', duration: '25 min', thumbnail: '🍽️', category: 'Nutrição', videoUrl: '', order: 3 },
    { id: '4', title: 'Jejum Intermitente', description: 'Guia completo', duration: '30 min', thumbnail: '⏰', category: 'Nutrição', videoUrl: '', order: 4 },
    { id: '5', title: 'Exercícios Iniciantes', description: 'Treinos simples', duration: '35 min', thumbnail: '💪', category: 'Exercícios', videoUrl: '', order: 5 },
    { id: '6', title: 'Controle Emocional', description: 'Fome emocional', duration: '20 min', thumbnail: '🧠', category: 'Mindset', videoUrl: '', order: 6 },
]

const defaultSettings: AppSettings = {
    appName: 'SlimFit',
    welcomeTitle: 'Sua jornada de transformação começa aqui',
    welcomeSubtitle: 'Transforme seu corpo com o poder da comunidade',
    primaryColor: '#00C853',
    secondaryColor: '#FF4081'
}

const defaultAIResponses: AIResponse[] = [
    { id: '1', keyword: 'dieta', response: 'Dicas de alimentação saudável...' },
    { id: '2', keyword: 'treino', response: 'Treino para iniciantes...' },
    { id: '3', keyword: 'jejum', response: 'Sobre jejum intermitente...' },
]

export default function AdminPanel() {
    const { profile } = useAuth()
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'posts' | 'challenges' | 'lessons' | 'ai' | 'settings' | 'logs'>('dashboard')
    const [users, setUsers] = useState<User[]>([])
    const [posts, setPosts] = useState<(Post & { user?: User })[]>([])
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [lessons, setLessons] = useState<Lesson[]>(defaultLessons)
    const [settings, setSettings] = useState<AppSettings>(defaultSettings)
    const [aiResponses, setAiResponses] = useState<AIResponse[]>(defaultAIResponses)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activityLogs, setActivityLogs] = useState<{ action: string, user: string, time: Date }[]>([])

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState<'challenge' | 'lesson' | 'ai' | 'user'>('challenge')
    const [editingItem, setEditingItem] = useState<any>(null)

    // Forms
    const [challengeForm, setChallengeForm] = useState({
        title: '', description: '', emoji: '🎯', color: '#00C853',
        duration_days: 7, difficulty: 'Fácil' as const, reward_points: 100
    })
    const [lessonForm, setLessonForm] = useState({
        title: '', description: '', duration: '15 min', thumbnail: '📚',
        category: 'Fundamentos', videoUrl: '', order: 1
    })
    const [aiForm, setAiForm] = useState({ keyword: '', response: '' })
    const [userForm, setUserForm] = useState({ name: '', points: 0, streak_days: 0, weight_goal: 0 })

    const isAdmin = profile?.email === ADMIN_EMAIL

    useEffect(() => {
        if (isAdmin) {
            fetchData()
            // Carregar settings do localStorage
            const savedSettings = localStorage.getItem('appSettings')
            if (savedSettings) setSettings(JSON.parse(savedSettings))
            const savedLessons = localStorage.getItem('adminLessons')
            if (savedLessons) setLessons(JSON.parse(savedLessons))
            const savedAI = localStorage.getItem('adminAIResponses')
            if (savedAI) setAiResponses(JSON.parse(savedAI))
        }
    }, [isAdmin])

    const fetchData = async () => {
        setLoading(true)
        const [usersRes, postsRes, challengesRes] = await Promise.all([
            supabase.from('users').select('*').order('created_at', { ascending: false }),
            supabase.from('posts').select('*, user:users(*)').order('created_at', { ascending: false }),
            supabase.from('challenges').select('*').order('created_at', { ascending: false })
        ])
        setUsers(usersRes.data || [])
        setPosts(postsRes.data || [])
        setChallenges(challengesRes.data || [])
        setLoading(false)
    }

    const addLog = (action: string, userName: string = 'Admin') => {
        setActivityLogs(prev => [{ action, user: userName, time: new Date() }, ...prev.slice(0, 49)])
    }

    // User actions
    const openUserModal = (user: User) => {
        setEditingItem(user)
        setUserForm({
            name: user.name,
            points: user.points,
            streak_days: user.streak_days,
            weight_goal: user.weight_goal || 0
        })
        setModalType('user')
        setShowModal(true)
    }

    const saveUser = async () => {
        if (!editingItem) return
        await supabase.from('users').update({
            name: userForm.name,
            points: userForm.points,
            streak_days: userForm.streak_days,
            weight_goal: userForm.weight_goal || null
        }).eq('id', editingItem.id)
        addLog(`Editou usuário: ${userForm.name}`)
        setShowModal(false)
        fetchData()
    }

    const deleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Excluir usuário "${userName}"? Esta ação é irreversível.`)) return
        await supabase.from('users').delete().eq('id', userId)
        addLog(`Excluiu usuário: ${userName}`)
        fetchData()
    }

    const banUser = async (userId: string, userName: string) => {
        await supabase.from('users').update({ points: -9999 }).eq('id', userId)
        addLog(`Baniu usuário: ${userName}`)
        fetchData()
    }

    // Post actions
    const deletePost = async (postId: string) => {
        if (!confirm('Excluir este post?')) return
        await supabase.from('posts').delete().eq('id', postId)
        addLog('Excluiu um post')
        fetchData()
    }

    const featurePost = async (postId: string) => {
        // Adiciona likes para destacar
        await supabase.from('posts').update({ likes_count: 999 }).eq('id', postId)
        addLog('Destacou um post')
        fetchData()
    }

    // Challenge actions
    const openChallengeModal = (challenge?: Challenge) => {
        if (challenge) {
            setEditingItem(challenge)
            setChallengeForm({
                title: challenge.title, description: challenge.description,
                emoji: challenge.emoji, color: challenge.color,
                duration_days: challenge.duration_days,
                difficulty: challenge.difficulty, reward_points: challenge.reward_points
            })
        } else {
            setEditingItem(null)
            setChallengeForm({ title: '', description: '', emoji: '🎯', color: '#00C853', duration_days: 7, difficulty: 'Fácil', reward_points: 100 })
        }
        setModalType('challenge')
        setShowModal(true)
    }

    const saveChallenge = async () => {
        const now = new Date()
        const endDate = new Date(now.getTime() + challengeForm.duration_days * 24 * 60 * 60 * 1000)
        if (editingItem) {
            await supabase.from('challenges').update({ ...challengeForm, end_date: endDate.toISOString() }).eq('id', editingItem.id)
            addLog(`Editou desafio: ${challengeForm.title}`)
        } else {
            await supabase.from('challenges').insert({ ...challengeForm, start_date: now.toISOString(), end_date: endDate.toISOString(), participants_count: 0 })
            addLog(`Criou desafio: ${challengeForm.title}`)
        }
        setShowModal(false)
        fetchData()
    }

    const deleteChallenge = async (id: string, title: string) => {
        if (!confirm(`Excluir desafio "${title}"?`)) return
        await supabase.from('challenges').delete().eq('id', id)
        addLog(`Excluiu desafio: ${title}`)
        fetchData()
    }

    // Lesson actions
    const openLessonModal = (lesson?: Lesson) => {
        if (lesson) {
            setEditingItem(lesson)
            setLessonForm({ title: lesson.title, description: lesson.description, duration: lesson.duration, thumbnail: lesson.thumbnail, category: lesson.category, videoUrl: lesson.videoUrl, order: lesson.order })
        } else {
            setEditingItem(null)
            setLessonForm({ title: '', description: '', duration: '15 min', thumbnail: '📚', category: 'Fundamentos', videoUrl: '', order: lessons.length + 1 })
        }
        setModalType('lesson')
        setShowModal(true)
    }

    const saveLesson = () => {
        let newLessons: Lesson[]
        if (editingItem) {
            newLessons = lessons.map(l => l.id === editingItem.id ? { ...l, ...lessonForm } : l)
            addLog(`Editou aula: ${lessonForm.title}`)
        } else {
            newLessons = [...lessons, { id: Date.now().toString(), ...lessonForm }]
            addLog(`Criou aula: ${lessonForm.title}`)
        }
        setLessons(newLessons)
        localStorage.setItem('adminLessons', JSON.stringify(newLessons))
        setShowModal(false)
    }

    const deleteLesson = (id: string, title: string) => {
        if (!confirm(`Excluir aula "${title}"?`)) return
        const newLessons = lessons.filter(l => l.id !== id)
        setLessons(newLessons)
        localStorage.setItem('adminLessons', JSON.stringify(newLessons))
        addLog(`Excluiu aula: ${title}`)
    }

    // AI actions
    const openAIModal = (item?: AIResponse) => {
        if (item) {
            setEditingItem(item)
            setAiForm({ keyword: item.keyword, response: item.response })
        } else {
            setEditingItem(null)
            setAiForm({ keyword: '', response: '' })
        }
        setModalType('ai')
        setShowModal(true)
    }

    const saveAIResponse = () => {
        let newResponses: AIResponse[]
        if (editingItem) {
            newResponses = aiResponses.map(r => r.id === editingItem.id ? { ...r, ...aiForm } : r)
        } else {
            newResponses = [...aiResponses, { id: Date.now().toString(), ...aiForm }]
        }
        setAiResponses(newResponses)
        localStorage.setItem('adminAIResponses', JSON.stringify(newResponses))
        addLog(`Salvou resposta IA: ${aiForm.keyword}`)
        setShowModal(false)
    }

    const deleteAIResponse = (id: string) => {
        const newResponses = aiResponses.filter(r => r.id !== id)
        setAiResponses(newResponses)
        localStorage.setItem('adminAIResponses', JSON.stringify(newResponses))
    }

    // Settings
    const saveSettings = () => {
        localStorage.setItem('appSettings', JSON.stringify(settings))
        addLog('Salvou configurações do app')
        alert('Configurações salvas!')
    }

    // Export
    const exportData = (type: 'users' | 'posts' | 'challenges') => {
        const data = type === 'users' ? users : type === 'posts' ? posts : challenges
        const json = JSON.stringify(data, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`
        a.click()
        addLog(`Exportou dados: ${type}`)
    }

    // Stats
    const stats = {
        totalUsers: users.length,
        totalPosts: posts.length,
        totalChallenges: challenges.length,
        totalLessons: lessons.length,
        activeUsers: users.filter(u => u.streak_days > 0).length,
        totalPoints: users.reduce((sum, u) => sum + (u.points || 0), 0),
        avgPoints: users.length ? Math.round(users.reduce((sum, u) => sum + (u.points || 0), 0) / users.length) : 0,
        totalLikes: posts.reduce((sum, p) => sum + (p.likes_count || 0), 0)
    }

    // Filter
    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
                <div>
                    <h1>⚙️ Painel Admin</h1>
                    <p className="admin-subtitle">Gerencie todo o aplicativo</p>
                </div>
                <span className="admin-badge">ADMIN</span>
            </header>

            {/* Tabs */}
            <div className="admin-tabs">
                {[
                    { id: 'dashboard', label: '📊 Dashboard' },
                    { id: 'users', label: '👥 Usuários' },
                    { id: 'posts', label: '📝 Posts' },
                    { id: 'challenges', label: '🏆 Desafios' },
                    { id: 'lessons', label: '📚 Aulas' },
                    { id: 'ai', label: '🤖 IA' },
                    { id: 'settings', label: '⚙️ Config' },
                    { id: 'logs', label: '📋 Logs' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={activeTab === tab.id ? 'active' : ''}
                        onClick={() => setActiveTab(tab.id as any)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="admin-content">
                {loading ? (
                    <div className="admin-loading">🔄 Carregando...</div>
                ) : (
                    <>
                        {/* Dashboard */}
                        {activeTab === 'dashboard' && (
                            <div className="dashboard-section">
                                <div className="stats-grid-admin">
                                    <div className="stat-card-admin primary">
                                        <span className="stat-number">{stats.totalUsers}</span>
                                        <span className="stat-label">Usuários</span>
                                        <span className="stat-icon">👥</span>
                                    </div>
                                    <div className="stat-card-admin success">
                                        <span className="stat-number">{stats.activeUsers}</span>
                                        <span className="stat-label">Ativos</span>
                                        <span className="stat-icon">🔥</span>
                                    </div>
                                    <div className="stat-card-admin info">
                                        <span className="stat-number">{stats.totalPosts}</span>
                                        <span className="stat-label">Posts</span>
                                        <span className="stat-icon">📝</span>
                                    </div>
                                    <div className="stat-card-admin warning">
                                        <span className="stat-number">{stats.totalChallenges}</span>
                                        <span className="stat-label">Desafios</span>
                                        <span className="stat-icon">🏆</span>
                                    </div>
                                    <div className="stat-card-admin purple">
                                        <span className="stat-number">{stats.totalLessons}</span>
                                        <span className="stat-label">Aulas</span>
                                        <span className="stat-icon">📚</span>
                                    </div>
                                    <div className="stat-card-admin pink">
                                        <span className="stat-number">{stats.totalLikes}</span>
                                        <span className="stat-label">Likes</span>
                                        <span className="stat-icon">❤️</span>
                                    </div>
                                    <div className="stat-card-admin orange">
                                        <span className="stat-number">{stats.totalPoints.toLocaleString()}</span>
                                        <span className="stat-label">Pontos Total</span>
                                        <span className="stat-icon">⭐</span>
                                    </div>
                                    <div className="stat-card-admin teal">
                                        <span className="stat-number">{stats.avgPoints}</span>
                                        <span className="stat-label">Média Pontos</span>
                                        <span className="stat-icon">📈</span>
                                    </div>
                                </div>

                                <div className="dashboard-grid">
                                    <div className="dashboard-card">
                                        <h3>🏅 Top Usuários</h3>
                                        {users.sort((a, b) => b.points - a.points).slice(0, 5).map((u, i) => (
                                            <div key={u.id} className="top-item">
                                                <span className="rank">{i + 1}º</span>
                                                <span className="name">{u.name}</span>
                                                <span className="value">{u.points} pts</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="dashboard-card">
                                        <h3>📝 Posts Recentes</h3>
                                        {posts.slice(0, 5).map(p => (
                                            <div key={p.id} className="recent-item">
                                                <span className="author">{p.user?.name}</span>
                                                <span className="preview">{p.content.substring(0, 30)}...</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="quick-actions">
                                    <h3>⚡ Ações Rápidas</h3>
                                    <div className="action-buttons">
                                        <button onClick={() => { setActiveTab('challenges'); openChallengeModal(); }}>+ Novo Desafio</button>
                                        <button onClick={() => { setActiveTab('lessons'); openLessonModal(); }}>+ Nova Aula</button>
                                        <button onClick={() => exportData('users')}>📥 Exportar Usuários</button>
                                        <button onClick={() => exportData('posts')}>📥 Exportar Posts</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Users */}
                        {activeTab === 'users' && (
                            <div className="section-admin">
                                <div className="section-header-admin">
                                    <h3>👥 Gerenciar Usuários ({users.length})</h3>
                                    <div className="header-actions">
                                        <input
                                            type="search"
                                            placeholder="Buscar usuário..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="search-input"
                                        />
                                        <button className="btn-export" onClick={() => exportData('users')}>📥 Exportar</button>
                                    </div>
                                </div>
                                <div className="admin-table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Nome</th>
                                                <th>Email</th>
                                                <th>Pontos</th>
                                                <th>Streak</th>
                                                <th>Meta (kg)</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map(user => (
                                                <tr key={user.id}>
                                                    <td>{user.name}</td>
                                                    <td className="email-cell">{user.email}</td>
                                                    <td><span className="badge points">{user.points}</span></td>
                                                    <td><span className="badge streak">🔥 {user.streak_days}</span></td>
                                                    <td>{user.weight_goal || '-'}</td>
                                                    <td className="actions-cell">
                                                        <button className="btn-icon edit" onClick={() => openUserModal(user)} title="Editar">✏️</button>
                                                        <button className="btn-icon warn" onClick={() => banUser(user.id, user.name)} title="Banir">🚫</button>
                                                        <button className="btn-icon delete" onClick={() => deleteUser(user.id, user.name)} title="Excluir" disabled={user.email === ADMIN_EMAIL}>🗑️</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Posts */}
                        {activeTab === 'posts' && (
                            <div className="section-admin">
                                <div className="section-header-admin">
                                    <h3>📝 Gerenciar Posts ({posts.length})</h3>
                                    <button className="btn-export" onClick={() => exportData('posts')}>📥 Exportar</button>
                                </div>
                                <div className="admin-table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Autor</th>
                                                <th>Conteúdo</th>
                                                <th>Likes</th>
                                                <th>Comentários</th>
                                                <th>Data</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {posts.map(post => (
                                                <tr key={post.id}>
                                                    <td>{post.user?.name || 'Anônimo'}</td>
                                                    <td className="content-cell">{post.content.substring(0, 50)}...</td>
                                                    <td><span className="badge likes">❤️ {post.likes_count}</span></td>
                                                    <td><span className="badge comments">💬 {post.comments_count}</span></td>
                                                    <td>{new Date(post.created_at).toLocaleDateString('pt-BR')}</td>
                                                    <td className="actions-cell">
                                                        <button className="btn-icon star" onClick={() => featurePost(post.id)} title="Destacar">⭐</button>
                                                        <button className="btn-icon delete" onClick={() => deletePost(post.id)} title="Excluir">🗑️</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Challenges */}
                        {activeTab === 'challenges' && (
                            <div className="section-admin">
                                <div className="section-header-admin">
                                    <h3>🏆 Gerenciar Desafios ({challenges.length})</h3>
                                    <button className="btn-add" onClick={() => openChallengeModal()}>+ Novo Desafio</button>
                                </div>
                                <div className="cards-grid">
                                    {challenges.map(challenge => (
                                        <div key={challenge.id} className="item-card" style={{ borderColor: challenge.color }}>
                                            <div className="item-emoji" style={{ background: `${challenge.color}20` }}>{challenge.emoji}</div>
                                            <div className="item-info">
                                                <h4>{challenge.title}</h4>
                                                <p>{challenge.description}</p>
                                                <div className="item-meta">
                                                    <span className={`difficulty ${challenge.difficulty.toLowerCase()}`}>{challenge.difficulty}</span>
                                                    <span>{challenge.duration_days} dias</span>
                                                    <span>🏆 {challenge.reward_points} pts</span>
                                                    <span>👥 {challenge.participants_count}</span>
                                                </div>
                                            </div>
                                            <div className="item-actions">
                                                <button onClick={() => openChallengeModal(challenge)}>✏️</button>
                                                <button onClick={() => deleteChallenge(challenge.id, challenge.title)}>🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Lessons */}
                        {activeTab === 'lessons' && (
                            <div className="section-admin">
                                <div className="section-header-admin">
                                    <h3>📚 Gerenciar Aulas ({lessons.length})</h3>
                                    <button className="btn-add" onClick={() => openLessonModal()}>+ Nova Aula</button>
                                </div>
                                <div className="cards-grid">
                                    {lessons.map(lesson => (
                                        <div key={lesson.id} className="item-card">
                                            <div className="item-emoji">{lesson.thumbnail}</div>
                                            <div className="item-info">
                                                <h4>{lesson.title}</h4>
                                                <p>{lesson.description}</p>
                                                <div className="item-meta">
                                                    <span className="category">{lesson.category}</span>
                                                    <span>⏱️ {lesson.duration}</span>
                                                    <span>📋 Ordem: {lesson.order}</span>
                                                </div>
                                            </div>
                                            <div className="item-actions">
                                                <button onClick={() => openLessonModal(lesson)}>✏️</button>
                                                <button onClick={() => deleteLesson(lesson.id, lesson.title)}>🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AI */}
                        {activeTab === 'ai' && (
                            <div className="section-admin">
                                <div className="section-header-admin">
                                    <h3>🤖 Respostas da IA ({aiResponses.length})</h3>
                                    <button className="btn-add" onClick={() => openAIModal()}>+ Nova Resposta</button>
                                </div>
                                <p className="section-hint">Configure palavras-chave e respostas automáticas da IA</p>
                                <div className="ai-list">
                                    {aiResponses.map(item => (
                                        <div key={item.id} className="ai-item">
                                            <div className="ai-keyword">🔑 {item.keyword}</div>
                                            <div className="ai-response">{item.response.substring(0, 100)}...</div>
                                            <div className="ai-actions">
                                                <button onClick={() => openAIModal(item)}>✏️</button>
                                                <button onClick={() => deleteAIResponse(item.id)}>🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Settings */}
                        {activeTab === 'settings' && (
                            <div className="section-admin">
                                <h3>⚙️ Configurações do App</h3>
                                <div className="settings-form">
                                    <div className="form-group">
                                        <label>Nome do App</label>
                                        <input type="text" value={settings.appName} onChange={e => setSettings({ ...settings, appName: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Título de Boas-vindas</label>
                                        <input type="text" value={settings.welcomeTitle} onChange={e => setSettings({ ...settings, welcomeTitle: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Subtítulo</label>
                                        <input type="text" value={settings.welcomeSubtitle} onChange={e => setSettings({ ...settings, welcomeSubtitle: e.target.value })} />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Cor Primária</label>
                                            <input type="color" value={settings.primaryColor} onChange={e => setSettings({ ...settings, primaryColor: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Cor Secundária</label>
                                            <input type="color" value={settings.secondaryColor} onChange={e => setSettings({ ...settings, secondaryColor: e.target.value })} />
                                        </div>
                                    </div>
                                    <button className="btn-primary btn-save" onClick={saveSettings}>💾 Salvar Configurações</button>
                                </div>
                            </div>
                        )}

                        {/* Logs */}
                        {activeTab === 'logs' && (
                            <div className="section-admin">
                                <h3>📋 Logs de Atividade</h3>
                                <div className="logs-list">
                                    {activityLogs.length === 0 ? (
                                        <p className="empty-logs">Nenhuma atividade registrada ainda</p>
                                    ) : (
                                        activityLogs.map((log, i) => (
                                            <div key={i} className="log-item">
                                                <span className="log-time">{log.time.toLocaleTimeString('pt-BR')}</span>
                                                <span className="log-user">{log.user}</span>
                                                <span className="log-action">{log.action}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowModal(false)}>×</button>

                        {modalType === 'challenge' && (
                            <>
                                <h3>{editingItem ? '✏️ Editar Desafio' : '🆕 Novo Desafio'}</h3>
                                <div className="form-group"><label>Título</label><input value={challengeForm.title} onChange={e => setChallengeForm({ ...challengeForm, title: e.target.value })} /></div>
                                <div className="form-group"><label>Descrição</label><textarea value={challengeForm.description} onChange={e => setChallengeForm({ ...challengeForm, description: e.target.value })} rows={3} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label>Emoji</label><input value={challengeForm.emoji} onChange={e => setChallengeForm({ ...challengeForm, emoji: e.target.value })} /></div>
                                    <div className="form-group"><label>Cor</label><input type="color" value={challengeForm.color} onChange={e => setChallengeForm({ ...challengeForm, color: e.target.value })} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>Duração (dias)</label><input type="number" value={challengeForm.duration_days} onChange={e => setChallengeForm({ ...challengeForm, duration_days: parseInt(e.target.value) || 7 })} /></div>
                                    <div className="form-group"><label>Pontos</label><input type="number" value={challengeForm.reward_points} onChange={e => setChallengeForm({ ...challengeForm, reward_points: parseInt(e.target.value) || 100 })} /></div>
                                </div>
                                <div className="form-group">
                                    <label>Dificuldade</label>
                                    <select value={challengeForm.difficulty} onChange={e => setChallengeForm({ ...challengeForm, difficulty: e.target.value as any })}>
                                        <option value="Fácil">Fácil</option><option value="Intermediário">Intermediário</option><option value="Avançado">Avançado</option>
                                    </select>
                                </div>
                                <button className="btn-primary btn-save" onClick={saveChallenge}>💾 Salvar</button>
                            </>
                        )}

                        {modalType === 'lesson' && (
                            <>
                                <h3>{editingItem ? '✏️ Editar Aula' : '🆕 Nova Aula'}</h3>
                                <div className="form-group"><label>Título</label><input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} /></div>
                                <div className="form-group"><label>Descrição</label><textarea value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} rows={2} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label>Emoji</label><input value={lessonForm.thumbnail} onChange={e => setLessonForm({ ...lessonForm, thumbnail: e.target.value })} /></div>
                                    <div className="form-group"><label>Duração</label><input value={lessonForm.duration} onChange={e => setLessonForm({ ...lessonForm, duration: e.target.value })} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Categoria</label>
                                        <select value={lessonForm.category} onChange={e => setLessonForm({ ...lessonForm, category: e.target.value })}>
                                            <option>Fundamentos</option><option>Nutrição</option><option>Exercícios</option><option>Mindset</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Ordem</label><input type="number" value={lessonForm.order} onChange={e => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) || 1 })} /></div>
                                </div>
                                <div className="form-group"><label>URL do Vídeo (opcional)</label><input value={lessonForm.videoUrl} onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} placeholder="https://..." /></div>
                                <button className="btn-primary btn-save" onClick={saveLesson}>💾 Salvar</button>
                            </>
                        )}

                        {modalType === 'ai' && (
                            <>
                                <h3>{editingItem ? '✏️ Editar Resposta' : '🆕 Nova Resposta IA'}</h3>
                                <div className="form-group"><label>Palavra-chave</label><input value={aiForm.keyword} onChange={e => setAiForm({ ...aiForm, keyword: e.target.value })} placeholder="Ex: dieta, treino, jejum" /></div>
                                <div className="form-group"><label>Resposta</label><textarea value={aiForm.response} onChange={e => setAiForm({ ...aiForm, response: e.target.value })} rows={6} placeholder="Resposta completa da IA..." /></div>
                                <button className="btn-primary btn-save" onClick={saveAIResponse}>💾 Salvar</button>
                            </>
                        )}

                        {modalType === 'user' && editingItem && (
                            <>
                                <h3>✏️ Editar Usuário</h3>
                                <div className="form-group"><label>Nome</label><input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label>Pontos</label><input type="number" value={userForm.points} onChange={e => setUserForm({ ...userForm, points: parseInt(e.target.value) || 0 })} /></div>
                                    <div className="form-group"><label>Streak</label><input type="number" value={userForm.streak_days} onChange={e => setUserForm({ ...userForm, streak_days: parseInt(e.target.value) || 0 })} /></div>
                                </div>
                                <div className="form-group"><label>Meta de Peso (kg)</label><input type="number" value={userForm.weight_goal} onChange={e => setUserForm({ ...userForm, weight_goal: parseFloat(e.target.value) || 0 })} /></div>
                                <button className="btn-primary btn-save" onClick={saveUser}>💾 Salvar</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
