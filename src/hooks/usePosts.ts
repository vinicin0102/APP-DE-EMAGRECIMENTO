import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Post, User } from '../lib/supabase'

// Cache simples em memória
const postsCache = {
  data: null as (Post & { user: User })[] | null,
  timestamp: 0,
  TTL: 30000 // 30 segundos
}

export function usePosts() {
    const [posts, setPosts] = useState<(Post & { user: User })[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const isMounted = useRef(true)
    const channelRef = useRef<any>(null)

    const fetchPosts = useCallback(async (silent = false) => {
        if (!isMounted.current) return

        // Verificar cache primeiro
        const now = Date.now()
        if (postsCache.data && (now - postsCache.timestamp) < postsCache.TTL && !silent) {
            setPosts(postsCache.data)
            setLoading(false)
            return
        }

        try {
            if (!silent) setLoading(true)

            const { data, error: queryError } = await supabase
                .from('posts')
                .select(`
                    *,
                    user:users(*)
                `)
                .order('created_at', { ascending: false })
                .limit(20)

            if (!isMounted.current) return

            if (queryError) {
                console.warn('Erro ao buscar posts:', queryError.message)
                if (!silent) {
                    setPosts([])
                    setError(queryError as Error)
                }
            } else {
                const postsData = data || []
                setPosts(postsData)
                // Atualizar cache
                postsCache.data = postsData
                postsCache.timestamp = Date.now()
            }
        } catch (err) {
            console.error('Erro ao buscar posts:', err)
            if (isMounted.current && !silent) {
                setPosts([])
                setError(err as Error)
            }
        } finally {
            if (isMounted.current && !silent) {
                setLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        isMounted.current = true
        fetchPosts()

        // Subscribe to realtime updates - com debounce
        let updateTimeout: NodeJS.Timeout
        const channel = supabase
            .channel('posts-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'posts' },
                () => {
                    // Debounce: aguardar 1 segundo antes de atualizar
                    clearTimeout(updateTimeout)
                    updateTimeout = setTimeout(() => {
                        if (isMounted.current) {
                            fetchPosts(true) // Silent update
                        }
                    }, 1000)
                }
            )
            .subscribe()

        channelRef.current = channel

        return () => {
            isMounted.current = false
            clearTimeout(updateTimeout)
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
            }
        }
    }, [fetchPosts])

    const createPost = async (content: string, imageUrl?: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: new Error('Not authenticated') }

        // Fetch user profile immediately to use in optimistic update or result
        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

        const { data, error } = await supabase.from('posts').insert({
            user_id: user.id,
            content,
            image_url: imageUrl,
            likes_count: 0,
            comments_count: 0,
            shares_count: 0
        }).select().single()

        if (error) {
            console.error('Erro no insert do post:', error)
            return { error }
        }

        if (data) {
            const userFallback = userData || {
                id: user.id,
                name: user.user_metadata?.full_name || user.user_metadata?.name || 'Usuário',
                email: user.email,
                avatar_url: user.user_metadata?.avatar_url,
                created_at: new Date().toISOString()
            } as any

            const newPost = { ...data, user: userFallback }
            setPosts(prev => [newPost, ...prev])
            // Invalidar cache
            postsCache.data = null
        }

        return { error: null }
    }

    const likePost = async (postId: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: new Error('Not authenticated') }

        // Check if already liked
        const { data: existingLike } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('post_id', postId)
            .single()

        if (existingLike) {
            // Unlike
            await supabase.from('likes').delete().eq('id', existingLike.id)
            await supabase.rpc('decrement_likes', { post_id: postId })
        } else {
            // Like
            await supabase.from('likes').insert({ user_id: user.id, post_id: postId })
            await supabase.rpc('increment_likes', { post_id: postId })
        }

        // Invalidar cache
        postsCache.data = null

        return { error: null }
    }

    return { posts, loading, error, createPost, likePost, refetch: fetchPosts }
}
