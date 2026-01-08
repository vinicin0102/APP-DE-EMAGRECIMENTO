import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Challenge, ChallengeParticipant } from '../lib/supabase'

// Cache simples
const challengesCache = {
  data: null as Challenge[] | null,
  timestamp: 0,
  TTL: 60000 // 1 minuto
}

export function useChallenges() {
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [userChallenges, setUserChallenges] = useState<ChallengeParticipant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const isMounted = useRef(true)

    const fetchChallenges = useCallback(async () => {
        if (!isMounted.current) return

        // Verificar cache
        const now = Date.now()
        if (challengesCache.data && (now - challengesCache.timestamp) < challengesCache.TTL) {
            setChallenges(challengesCache.data)
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const { data, error: queryError } = await supabase
                .from('challenges')
                .select('*')
                .order('created_at', { ascending: false })

            if (!isMounted.current) return

            if (queryError) {
                console.warn('Tabela challenges não encontrada ou erro:', queryError.message)
                setChallenges([])
            } else {
                const challengesData = data || []
                setChallenges(challengesData)
                // Atualizar cache
                challengesCache.data = challengesData
                challengesCache.timestamp = Date.now()
            }
        } catch (err) {
            console.error('Erro ao buscar desafios:', err)
            if (isMounted.current) {
                setChallenges([])
            }
        } finally {
            if (isMounted.current) {
                setLoading(false)
            }
        }
    }, [])

    const fetchUserChallenges = useCallback(async () => {
        if (!isMounted.current) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error: queryError } = await supabase
                .from('challenge_participants')
                .select('*')
                .eq('user_id', user.id)

            if (!isMounted.current) return

            if (queryError) {
                console.warn('Tabela challenge_participants não encontrada ou erro:', queryError.message)
                setUserChallenges([])
            } else {
                setUserChallenges(data || [])
            }
        } catch (err) {
            console.error('Erro ao buscar participações:', err)
            if (isMounted.current) {
                setUserChallenges([])
            }
        }
    }, [])

    useEffect(() => {
        isMounted.current = true

        const loadData = async () => {
            await fetchChallenges()
            await fetchUserChallenges()
        }
        loadData()

        return () => {
            isMounted.current = false
        }
    }, [fetchChallenges, fetchUserChallenges])

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
            // Invalidar cache
            challengesCache.data = null
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
