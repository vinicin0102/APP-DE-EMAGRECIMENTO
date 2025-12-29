import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Post, User } from '../lib/supabase'

export function usePosts() {
    const [posts, setPosts] = useState<(Post & { user: User })[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchPosts = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('posts')
                .select(`
            *,
            user:users(*)
          `)
                .order('created_at', { ascending: false })
                .limit(20)

            if (error) {
                console.warn('Erro ao buscar posts:', error.message)
                setPosts([])
            } else {
                setPosts(data || [])
            }
        } catch (err) {
            console.error('Erro ao buscar posts:', err)
            setPosts([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPosts()

        // Subscribe to realtime updates
        const channel = supabase
            .channel('posts-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'posts' },
                () => fetchPosts()
            )
            .subscribe()

        return () => {
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
