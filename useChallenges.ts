import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Challenge, ChallengeParticipant } from '../lib/supabase'

export function useChallenges() {
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [userChallenges, setUserChallenges] = useState<ChallengeParticipant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchChallenges = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('challenges')
            .select('*')
            .gte('end_date', new Date().toISOString())
            .order('participants_count', { ascending: false })

        if (error) {
            setError(error)
        } else {
            setChallenges(data || [])
        }
        setLoading(false)
    }

    const fetchUserChallenges = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('challenge_participants')
            .select('*')
            .eq('user_id', user.id)

        setUserChallenges(data || [])
    }

    useEffect(() => {
        fetchChallenges()
        fetchUserChallenges()
    }, [])

    const joinChallenge = async (challengeId: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: new Error('Not authenticated') }

        const { error } = await supabase.from('challenge_participants').insert({
            user_id: user.id,
            challenge_id: challengeId,
            progress: 0
        })

        if (!error) {
            await supabase.rpc('increment_participants', { challenge_id: challengeId })
            await fetchUserChallenges()
        }

        return { error }
    }

    const updateProgress = async (challengeId: string, progress: number) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: new Error('Not authenticated') }

        const { error } = await supabase
            .from('challenge_participants')
            .update({
                progress,
                completed_at: progress >= 100 ? new Date().toISOString() : null
            })
            .eq('user_id', user.id)
            .eq('challenge_id', challengeId)

        if (!error) {
            await fetchUserChallenges()
        }

        return { error }
    }

    const isParticipating = (challengeId: string) => {
        return userChallenges.some(uc => uc.challenge_id === challengeId)
    }

    const getProgress = (challengeId: string) => {
        const participation = userChallenges.find(uc => uc.challenge_id === challengeId)
        return participation?.progress || 0
    }

    return {
        challenges,
        userChallenges,
        loading,
        error,
        joinChallenge,
        updateProgress,
        isParticipating,
        getProgress,
        refetch: fetchChallenges
    }
}
