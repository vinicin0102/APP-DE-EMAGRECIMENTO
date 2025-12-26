import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Stats {
    totalUsers: number
    totalChallenges: number
    totalWeightLost: number
    averageRating: number
}

export function useStats() {
    const [stats, setStats] = useState<Stats>({
        totalUsers: 10000,
        totalChallenges: 500,
        totalWeightLost: 50000,
        averageRating: 4.9
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Contar usuários
                const { count: usersCount } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true })

                // Contar desafios
                const { count: challengesCount } = await supabase
                    .from('challenges')
                    .select('*', { count: 'exact', head: true })

                // Somar participantes de desafios
                const { data: participantsData } = await supabase
                    .from('challenges')
                    .select('participants_count')

                const totalParticipants = participantsData?.reduce((acc, c) => acc + (c.participants_count || 0), 0) || 0

                setStats({
                    totalUsers: usersCount || 10000,
                    totalChallenges: challengesCount || 500,
                    totalWeightLost: Math.max(50000, totalParticipants * 5), // Estimativa
                    averageRating: 4.9
                })
            } catch (error) {
                console.error('Error fetching stats:', error)
            }
            setLoading(false)
        }

        fetchStats()
    }, [])

    return { stats, loading }
}
