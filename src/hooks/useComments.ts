import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Comment, User } from '../lib/supabase'

export function useComments(postId: string | null) {
    const [comments, setComments] = useState<(Comment & { user: User })[]>([])
    const [loading, setLoading] = useState(false)

    const fetchComments = async () => {
        if (!postId) return
        setLoading(true)

        const { data } = await supabase
            .from('comments')
            .select(`
        *,
        user:users(*)
      `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

        setComments(data || [])
        setLoading(false)
    }

    useEffect(() => {
        if (postId) {
            fetchComments()
        }
    }, [postId])

    const addComment = async (content: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !postId) return { error: new Error('Not authenticated') }

        const { error } = await supabase.from('comments').insert({
            user_id: user.id,
            post_id: postId,
            content
        })

        if (!error) {
            // Incrementar contador de comentários no post
            await supabase.rpc('increment_comments', { post_id: postId })
            await fetchComments()
        }

        return { error }
    }

    const deleteComment = async (commentId: string) => {
        const { error } = await supabase.from('comments').delete().eq('id', commentId)

        if (!error && postId) {
            await supabase.rpc('decrement_comments', { post_id: postId })
            await fetchComments()
        }

        return { error }
    }

    return { comments, loading, addComment, deleteComment, refetch: fetchComments }
}
