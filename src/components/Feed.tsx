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
    const { posts, loading: postsLoading, createPost, likePost, refetch } = usePosts()
    const [newPost, setNewPost] = useState('')
    const [imageUrl, setImageUrl] = useState('')

    const [posting, setPosting] = useState(false)
    const [localLikes, setLocalLikes] = useState<Record<string, boolean>>({})
    const [postExtras, setPostExtras] = useState<Record<string, PostWithComments>>({})
    const [forceLoaded, setForceLoaded] = useState(false)
    const [editingPost, setEditingPost] = useState<{ id: string, content: string } | null>(null)
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) return
            const file = event.target.files[0]
            setUploading(true)

            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${user?.id}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('posts-images')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('posts-images').getPublicUrl(filePath)
            setImageUrl(data.publicUrl)
        } catch (error: any) {
            console.error('Erro no upload:', error)
            alert('Erro ao enviar imagem. Verifique no Admin se o bucket "posts-images" foi criado.')
        } finally {
            setUploading(false)
        }
    }

    // Timeout de segurança - força carregamento após 5 segundos
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (postsLoading) {
                console.warn('Feed: Timeout de loading atingido, forçando carregamento')
                setForceLoaded(true)
            }
        }, 5000)
        return () => clearTimeout(timeout)
    }, [postsLoading])

    const loading = postsLoading && !forceLoaded

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
        setImageUrl('')
        /* showImageInput removido */
        setPosting(false)
    }

    const handleLike = async (postId: string) => {
        if (!user) return
        setLocalLikes(prev => ({ ...prev, [postId]: !prev[postId] }))
        await likePost(postId)
    }

    const handleDeletePost = async (postId: string) => {
        if (!user) return
        setActiveMenuId(null)
        if (confirm('Tem certeza que deseja excluir este post?')) {
            await supabase.from('posts').delete().eq('id', postId)
            refetch()
        }
    }

    const handleUpdatePost = async () => {
        if (!editingPost || !editingPost.content.trim()) return
        await supabase.from('posts').update({ content: editingPost.content }).eq('id', editingPost.id)
        setEditingPost(null)
        refetch()
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
                    <h1>Clube das <span className="gradient-text">Musas</span></h1>
                    <p className="feed-subtitle">Feed de resultados: compartilhe resultados e experiências e troque por pontos</p>
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

                    {/* Preview da Imagem */}
                    {imageUrl && (
                        <div className="image-preview-container">
                            <img src={imageUrl} alt="Preview" className="post-image-preview" />
                            <button className="remove-image-btn" onClick={() => setImageUrl('')}>×</button>
                        </div>
                    )}

                    <div className="create-post-actions">
                        <div className="post-tools">
                            <label className={`tool-btn ${imageUrl ? 'active' : ''} ${uploading ? 'uploading' : ''}`}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                    disabled={uploading}
                                />
                                {uploading ? (
                                    <span className="loading-spinner-small">⌛</span>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21,15 16,10 5,21" />
                                    </svg>
                                )}
                            </label>
                            {/* Botão GIF removido ou mantido conforme desejo, vou manter mas só imagem funciona agora */}
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

                                        {(isOwner) && (
                                            <div style={{ position: 'relative' }}>
                                                <button
                                                    className="post-more"
                                                    onClick={() => setActiveMenuId(activeMenuId === post.id ? null : post.id)}
                                                >
                                                    •••
                                                </button>
                                                {activeMenuId === post.id && (
                                                    <div className="post-menu-dropdown">
                                                        {!post.image_url && (
                                                            <button onClick={() => {
                                                                setEditingPost({ id: post.id, content: post.content })
                                                                setActiveMenuId(null)
                                                            }} className="menu-item-btn">
                                                                ✏️ Editar
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeletePost(post.id)}
                                                            className="menu-item-btn delete"
                                                        >
                                                            🗑️ Excluir
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {editingPost?.id === post.id ? (
                                        <div className="edit-post-container">
                                            <textarea
                                                value={editingPost.content}
                                                onChange={e => setEditingPost({ ...editingPost, content: e.target.value })}
                                                className="edit-post-textarea"
                                                rows={3}
                                            />
                                            <div className="edit-post-actions">
                                                <button className="btn-cancel" onClick={() => setEditingPost(null)}>Cancelar</button>
                                                <button className="btn-save" onClick={handleUpdatePost}>Salvar</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="post-content">{post.content}</p>
                                    )}

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

                                    </div>

                                    {/* Seção de Comentários */}
                                    {
                                        extras?.showComments && (
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
                                        )
                                    }
                                </article>
                            )
                        })}
                    </div>
                )}
            </div>
        </div >
    )
}
