import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePosts } from '../hooks/usePosts'
import { supabase } from '../lib/supabase'
import type { Comment, User } from '../lib/supabase'
import './Feed.css'

interface PostWithComments {
    id: string
    showComments: boolean
    comments: (Comment & { user: User })[]
    loadingComments: boolean
    newComment: string
}

export default function Feed() {
    const { user, profile } = useAuth()
    const { posts, loading, createPost, likePost, refetch } = usePosts()
    const [newPost, setNewPost] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [showImageInput, setShowImageInput] = useState(false)
    const [posting, setPosting] = useState(false)
    const [localLikes, setLocalLikes] = useState<Record<string, boolean>>({})
    const [postExtras, setPostExtras] = useState<Record<string, PostWithComments>>({})

    // Dados estáticos de exemplo
    const staticPosts = [
        {
            id: '1',
            user_id: '1',
            content: 'Finalmente atingi minha meta! 💪 Foram 6 meses de dedicação, mas valeu cada esforço. Obrigada a todos pelo apoio!',
            image_url: null,
            likes_count: 324,
            comments_count: 45,
            shares_count: 12,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            user: { id: '1', name: 'Marina Santos', email: 'm@email.com', points: 2450, streak_days: 45, created_at: '', updated_at: '' }
        },
        {
            id: '2',
            user_id: '2',
            content: 'Dia 21 do desafio de jejum intermitente completo! Nunca me senti tão bem e disposta. Quem mais está participando? 🔥',
            image_url: null,
            likes_count: 189,
            comments_count: 32,
            shares_count: 8,
            created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            user: { id: '2', name: 'Ana Paula', email: 'a@email.com', points: 1890, streak_days: 21, created_at: '', updated_at: '' }
        },
        {
            id: '3',
            user_id: '3',
            content: 'Primeira vez correndo 5km sem parar! Há 3 meses eu mal conseguia caminhar rápido. A evolução é real! 🏃‍♂️',
            image_url: null,
            likes_count: 456,
            comments_count: 78,
            shares_count: 23,
            created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            user: { id: '3', name: 'Roberto Lima', email: 'r@email.com', points: 3200, streak_days: 67, created_at: '', updated_at: '' }
        },
    ]

    const displayPosts = posts.length > 0 ? posts : staticPosts

    const handleCreatePost = async () => {
        if (!newPost.trim() || !user) return
        setPosting(true)
        await createPost(newPost, imageUrl || undefined)
        setNewPost('')
        setImageUrl('')
        setShowImageInput(false)
        setPosting(false)
    }

    const handleLike = async (postId: string) => {
        if (!user) return
        setLocalLikes(prev => ({ ...prev, [postId]: !prev[postId] }))
        await likePost(postId)
    }

    const handleDeletePost = async (postId: string) => {
        if (!user) return
        if (confirm('Tem certeza que deseja excluir este post?')) {
            await supabase.from('posts').delete().eq('id', postId)
            refetch()
        }
    }

    const toggleComments = async (postId: string) => {
        const current = postExtras[postId]

        if (current?.showComments) {
            setPostExtras(prev => ({
                ...prev,
                [postId]: { ...prev[postId], showComments: false }
            }))
            return
        }

        // Carregar comentários
        setPostExtras(prev => ({
            ...prev,
            [postId]: {
                ...prev[postId],
                id: postId,
                showComments: true,
                loadingComments: true,
                comments: [],
                newComment: ''
            }
        }))

        const { data } = await supabase
            .from('comments')
            .select('*, user:users(*)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

        setPostExtras(prev => ({
            ...prev,
            [postId]: {
                ...prev[postId],
                loadingComments: false,
                comments: data || []
            }
        }))
    }

    const handleAddComment = async (postId: string) => {
        const comment = postExtras[postId]?.newComment
        if (!comment?.trim() || !user) return

        await supabase.from('comments').insert({
            user_id: user.id,
            post_id: postId,
            content: comment
        })

        // Recarregar comentários
        const { data } = await supabase
            .from('comments')
            .select('*, user:users(*)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

        setPostExtras(prev => ({
            ...prev,
            [postId]: {
                ...prev[postId],
                newComment: '',
                comments: data || []
            }
        }))
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / (1000 * 60))
        if (minutes < 1) return 'agora'
        if (minutes < 60) return `${minutes}min`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h`
        const days = Math.floor(hours / 24)
        return `${days}d`
    }

    const getAvatarColor = (name: string) => {
        const colors = ['#FF4081', '#2979FF', '#7C4DFF', '#00C853', '#FF6D00']
        return colors[name.charCodeAt(0) % colors.length]
    }

    const handleShare = async (postContent: string) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'SlimFit',
                    text: postContent,
                    url: window.location.href
                })
            } catch (err) {
                console.log('Erro ao compartilhar:', err)
            }
        } else {
            navigator.clipboard.writeText(postContent)
            alert('Texto copiado para a área de transferência!')
        }
    }

    return (
        <div className="feed-page">
            <header className="page-header">
                <div className="feed-header">
                    <h1>Slim<span className="gradient-text">Fit</span></h1>
                </div>
            </header>

            <div className="page-container">

                {/* Criar Post */}
                <div className="create-post-card">
                    <div className="create-post-header">
                        <div className="post-avatar" style={{ background: getAvatarColor(profile?.name || 'U') }}>
                            {profile?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <textarea
                            placeholder="Compartilhe sua jornada..."
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {showImageInput && (
                        <div className="image-input-container">
                            <input
                                type="url"
                                placeholder="Cole a URL da imagem..."
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                            />
                            {imageUrl && (
                                <div className="image-preview">
                                    <img src={imageUrl} alt="Preview" onError={() => setImageUrl('')} />
                                    <button onClick={() => setImageUrl('')}>×</button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="create-post-actions">
                        <div className="post-tools">
                            <button
                                className={`tool-btn ${showImageInput ? 'active' : ''}`}
                                onClick={() => setShowImageInput(!showImageInput)}
                                title="Adicionar imagem"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21,15 16,10 5,21" />
                                </svg>
                            </button>
                            <button className="tool-btn" title="GIF">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="M8 10h.01M16 10h.01M9.5 16a3.5 3.5 0 0 0 5 0" />
                                </svg>
                            </button>
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

                {/* Posts */}
                {loading ? (
                    <div className="loading-posts">
                        <div className="loading-spinner"></div>
                        <p>Carregando posts...</p>
                    </div>
                ) : (
                    <div className="posts-list">
                        {displayPosts.map((post) => {
                            const isOwner = user?.id === post.user_id
                            const extras = postExtras[post.id]

                            return (
                                <article key={post.id} className="post-card">
                                    <div className="post-header">
                                        <div
                                            className="post-avatar"
                                            style={{ background: getAvatarColor(post.user?.name || 'U') }}
                                        >
                                            {post.user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="post-user-info">
                                            <span className="post-user-name">{post.user?.name || 'Usuário'}</span>
                                            <span className="post-time">{formatTime(post.created_at)}</span>
                                        </div>
                                        {isOwner ? (
                                            <button className="post-more" onClick={() => handleDeletePost(post.id)}>
                                                🗑️
                                            </button>
                                        ) : (
                                            <button className="post-more">•••</button>
                                        )}
                                    </div>

                                    <p className="post-content">{post.content}</p>

                                    {post.image_url && (
                                        <div className="post-image">
                                            <img src={post.image_url} alt="Post" />
                                        </div>
                                    )}

                                    <div className="post-stats">
                                        <span>{(post.likes_count || 0) + (localLikes[post.id] ? 1 : 0)} curtidas</span>
                                        <span>{post.comments_count || 0} comentários</span>
                                    </div>

                                    <div className="post-actions">
                                        <button
                                            className={`action-btn ${localLikes[post.id] ? 'liked' : ''}`}
                                            onClick={() => handleLike(post.id)}
                                        >
                                            <svg viewBox="0 0 24 24" fill={localLikes[post.id] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" width="18" height="18">
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                            </svg>
                                            <span>Curtir</span>
                                        </button>
                                        <button
                                            className="action-btn"
                                            onClick={() => toggleComments(post.id)}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                            </svg>
                                            <span>Comentar</span>
                                        </button>
                                        <button
                                            className="action-btn"
                                            onClick={() => handleShare(post.content)}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                                <circle cx="18" cy="5" r="3" />
                                                <circle cx="6" cy="12" r="3" />
                                                <circle cx="18" cy="19" r="3" />
                                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                            </svg>
                                            <span>Compartilhar</span>
                                        </button>
                                    </div>

                                    {/* Seção de Comentários */}
                                    {extras?.showComments && (
                                        <div className="comments-section">
                                            {extras.loadingComments ? (
                                                <div className="loading-comments">Carregando...</div>
                                            ) : (
                                                <>
                                                    <div className="comments-list">
                                                        {extras.comments.length === 0 ? (
                                                            <p className="no-comments">Seja o primeiro a comentar!</p>
                                                        ) : (
                                                            extras.comments.map(comment => (
                                                                <div key={comment.id} className="comment-item">
                                                                    <div
                                                                        className="comment-avatar"
                                                                        style={{ background: getAvatarColor(comment.user?.name || 'U') }}
                                                                    >
                                                                        {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                                    </div>
                                                                    <div className="comment-content">
                                                                        <span className="comment-author">{comment.user?.name || 'Usuário'}</span>
                                                                        <p>{comment.content}</p>
                                                                        <span className="comment-time">{formatTime(comment.created_at)}</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>

                                                    <div className="add-comment">
                                                        <input
                                                            type="text"
                                                            placeholder="Escreva um comentário..."
                                                            value={extras.newComment || ''}
                                                            onChange={(e) => setPostExtras(prev => ({
                                                                ...prev,
                                                                [post.id]: { ...prev[post.id], newComment: e.target.value }
                                                            }))}
                                                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                                        />
                                                        <button
                                                            onClick={() => handleAddComment(post.id)}
                                                            disabled={!extras.newComment?.trim()}
                                                        >
                                                            ➤
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </article>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
