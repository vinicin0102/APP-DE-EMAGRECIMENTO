import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePosts } from '../hooks/usePosts'
import './Community.css'

interface CommunityProps {
    fullPage?: boolean
}

// Dados estáticos para exibir quando não há posts no banco
const staticPosts = [
    {
        id: '1',
        user: { name: 'Marina Santos', avatar: 'M', color: '#FF4081' },
        badge: '🏆 -20kg',
        time: '2h atrás',
        content: 'Finalmente atingi minha meta! 💪 Foram 6 meses de dedicação, mas valeu cada esforço. Obrigada a todos pelo apoio!',
        likes: 324,
        comments: 45,
        shares: 12,
        liked: false,
    },
    {
        id: '2',
        user: { name: 'Carlos Oliveira', avatar: 'C', color: '#2979FF' },
        badge: '⭐ Premium',
        time: '4h atrás',
        content: 'Minha receita de panqueca fit que faz sucesso aqui em casa! Super fácil e deliciosa 🥞',
        likes: 189,
        comments: 32,
        shares: 67,
        liked: true,
    },
    {
        id: '3',
        user: { name: 'Ana Paula', avatar: 'A', color: '#7C4DFF' },
        badge: '🔥 21 dias',
        time: '5h atrás',
        content: 'Dia 21 do desafio de jejum intermitente completo! Nunca me senti tão bem e disposta. Quem mais está participando?',
        likes: 456,
        comments: 78,
        shares: 23,
        liked: false,
    },
]

export default function Community({ fullPage }: CommunityProps) {
    const { user } = useAuth()
    const { posts, loading, createPost, likePost } = usePosts()
    const [newPost, setNewPost] = useState('')
    const [posting, setPosting] = useState(false)
    const [localLikes, setLocalLikes] = useState<Record<string, boolean>>({})

    // Usar posts do banco ou dados estáticos
    const displayPosts = posts.length > 0 ? posts : null

    const handleCreatePost = async () => {
        if (!newPost.trim() || !user) return
        setPosting(true)
        await createPost(newPost)
        setNewPost('')
        setPosting(false)
    }

    const handleLike = async (postId: string) => {
        if (!user) return
        setLocalLikes(prev => ({ ...prev, [postId]: !prev[postId] }))
        await likePost(postId)
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        if (hours < 1) return 'agora mesmo'
        if (hours < 24) return `${hours}h atrás`
        const days = Math.floor(hours / 24)
        return `${days}d atrás`
    }

    const getAvatarColor = (name: string) => {
        const colors = ['#FF4081', '#2979FF', '#7C4DFF', '#00C853', '#FF6D00']
        return colors[name.charCodeAt(0) % colors.length]
    }

    return (
        <section id="community" className={`community-section ${fullPage ? 'full-page' : ''}`}>
            <h2>
                Histórias que
                <span className="highlight"> inspiram</span>
            </h2>
            <p className="section-subtitle">
                Veja o que nossa comunidade está conquistando e compartilhe sua jornada
            </p>

            <div className="community-container">
                <div className="posts-feed">
                    {/* Criar novo post */}
                    {user && (
                        <div className="create-post-card">
                            <div className="create-post-header">
                                <div className="post-avatar" style={{ background: getAvatarColor(user.email || 'U') }}>
                                    {user.email?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <textarea
                                    placeholder="Compartilhe sua jornada com a comunidade..."
                                    value={newPost}
                                    onChange={(e) => setNewPost(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="create-post-actions">
                                <div className="post-tools">
                                    <button className="tool-btn" title="Adicionar foto">📷</button>
                                    <button className="tool-btn" title="Adicionar emoji">😊</button>
                                </div>
                                <button
                                    className="btn-primary btn-post"
                                    onClick={handleCreatePost}
                                    disabled={!newPost.trim() || posting}
                                >
                                    {posting ? 'Publicando...' : 'Publicar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-posts">
                            <span>🔄</span>
                            <p>Carregando posts...</p>
                        </div>
                    ) : displayPosts ? (
                        // Posts do banco de dados
                        displayPosts.map((post, index) => (
                            <article
                                key={post.id}
                                className="post-card"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="post-header">
                                    <div
                                        className="post-avatar"
                                        style={{ background: getAvatarColor(post.user?.name || 'U') }}
                                    >
                                        {post.user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="post-user-info">
                                        <span className="post-user-name">{post.user?.name || 'Usuário'}</span>
                                        <div className="post-meta">
                                            <span className="post-badge">⭐ Membro</span>
                                            <span className="post-time">{formatTime(post.created_at)}</span>
                                        </div>
                                    </div>
                                    <button className="post-more">•••</button>
                                </div>

                                <p className="post-content">{post.content}</p>

                                {post.image_url && (
                                    <div className="post-image">
                                        <img src={post.image_url} alt="Post" />
                                    </div>
                                )}

                                <div className="post-actions">
                                    <button
                                        className={`action-btn ${localLikes[post.id] ? 'liked' : ''}`}
                                        onClick={() => handleLike(post.id)}
                                    >
                                        <span className="action-icon">{localLikes[post.id] ? '❤️' : '🤍'}</span>
                                        <span>{post.likes_count + (localLikes[post.id] ? 1 : 0)}</span>
                                    </button>
                                    <button className="action-btn">
                                        <span className="action-icon">💬</span>
                                        <span>{post.comments_count}</span>
                                    </button>
                                    <button className="action-btn">
                                        <span className="action-icon">🔄</span>
                                        <span>{post.shares_count}</span>
                                    </button>
                                    <button className="action-btn bookmark">
                                        <span className="action-icon">🔖</span>
                                    </button>
                                </div>
                            </article>
                        ))
                    ) : (
                        // Posts estáticos quando não há dados
                        staticPosts.map((post, index) => (
                            <article
                                key={post.id}
                                className="post-card"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="post-header">
                                    <div
                                        className="post-avatar"
                                        style={{ background: post.user.color }}
                                    >
                                        {post.user.avatar}
                                    </div>
                                    <div className="post-user-info">
                                        <span className="post-user-name">{post.user.name}</span>
                                        <div className="post-meta">
                                            <span className="post-badge">{post.badge}</span>
                                            <span className="post-time">{post.time}</span>
                                        </div>
                                    </div>
                                    <button className="post-more">•••</button>
                                </div>

                                <p className="post-content">{post.content}</p>

                                <div className="post-actions">
                                    <button className={`action-btn ${post.liked ? 'liked' : ''}`}>
                                        <span className="action-icon">{post.liked ? '❤️' : '🤍'}</span>
                                        <span>{post.likes}</span>
                                    </button>
                                    <button className="action-btn">
                                        <span className="action-icon">💬</span>
                                        <span>{post.comments}</span>
                                    </button>
                                    <button className="action-btn">
                                        <span className="action-icon">🔄</span>
                                        <span>{post.shares}</span>
                                    </button>
                                    <button className="action-btn bookmark">
                                        <span className="action-icon">🔖</span>
                                    </button>
                                </div>
                            </article>
                        ))
                    )}
                </div>

                <aside className="community-sidebar">
                    <div className="sidebar-card">
                        <h3>🔥 Trending</h3>
                        <div className="trending-list">
                            <div className="trending-item">
                                <span className="trending-tag">#JejumIntermitente</span>
                                <span className="trending-count">2.3k posts</span>
                            </div>
                            <div className="trending-item">
                                <span className="trending-tag">#Desafio30Dias</span>
                                <span className="trending-count">1.8k posts</span>
                            </div>
                            <div className="trending-item">
                                <span className="trending-tag">#ReceitasFit</span>
                                <span className="trending-count">1.2k posts</span>
                            </div>
                            <div className="trending-item">
                                <span className="trending-tag">#AnteseDepois</span>
                                <span className="trending-count">956 posts</span>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-card">
                        <h3>⭐ Top da Semana</h3>
                        <div className="top-users">
                            <div className="top-user">
                                <div className="rank gold">1</div>
                                <div className="top-avatar" style={{ background: '#FF4081' }}>M</div>
                                <div className="top-info">
                                    <span className="top-name">Marina S.</span>
                                    <span className="top-points">2.450 pts</span>
                                </div>
                            </div>
                            <div className="top-user">
                                <div className="rank silver">2</div>
                                <div className="top-avatar" style={{ background: '#2979FF' }}>C</div>
                                <div className="top-info">
                                    <span className="top-name">Carlos O.</span>
                                    <span className="top-points">2.180 pts</span>
                                </div>
                            </div>
                            <div className="top-user">
                                <div className="rank bronze">3</div>
                                <div className="top-avatar" style={{ background: '#7C4DFF' }}>A</div>
                                <div className="top-info">
                                    <span className="top-name">Ana P.</span>
                                    <span className="top-points">1.950 pts</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </section>
    )
}
