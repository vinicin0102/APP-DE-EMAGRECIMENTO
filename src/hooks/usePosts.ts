import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Post, User } from '../lib/supabase'

export function usePosts() {
    const [posts, setPosts] = useState<(Post & { user: User })[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const isMounted = useRef(true)

    const fetchPosts = async () => {
        if (!isMounted.current) return

        try {
            setLoading(true)

            // Criar timeout manual
            const timeoutPromise = new Promise<null>((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), 5000)
            })

            const queryPromise = supabase
                .from('posts')
                .select(`
                    *,
                    user:users(*)
                `)
                .order('created_at', { ascending: false })
                .limit(20)

            const result = await Promise.race([queryPromise, timeoutPromise])

            if (!isMounted.current) return

            if (result === null) {
                // Timeout atingido
                console.warn('Timeout ao buscar posts')
                setPosts([])
                return
            }

            const { data, error: queryError } = result as { data: (Post & { user: User })[] | null, error: Error | null }

            if (queryError) {
                console.warn('Erro ao buscar posts:', queryError.message)
                setPosts([])
            } else {
                setPosts(data || [])
            }
        } catch (err) {
            console.error('Erro ao buscar posts:', err)
            if (isMounted.current) {
                setPosts([])
            }
        } finally {
            if (isMounted.current) {
                setLoading(false)
            }
        }
    }

    useEffect(() => {
        isMounted.current = true
        fetchPosts()

        // Timeout de segurança - força loading false após 6 segundos
        const safetyTimeout = setTimeout(() => {
            if (isMounted.current) {
                setLoading(false)
            }
        }, 6000)

        // Subscribe to realtime updates
        const channel = supabase
            .channel('posts-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'posts' },
                () => {
                    if (isMounted.current) {
                        fetchPosts()
                    }
                }
            )
            .subscribe()

        return () => {
            isMounted.current = false
            clearTimeout(safetyTimeout)
            supabase.removeChannel(channel)
        }
    }, [])

    const createPost = async (content: string, imageUrl?: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: new Error('Not authenticated') }

        const { error } = await supabase.from('posts').insert({
            user_id: user.id,
            content,
            image_url: imageUrl,
            likes_count: 0,
            comments_count: 0,
            shares_count: 0
        })

        return { error }
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

        return { error: null }
    }

    return { posts, loading, error, createPost, likePost, refetch: fetchPosts }
}
