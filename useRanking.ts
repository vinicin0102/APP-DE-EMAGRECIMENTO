import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../lib/supabase'

export function useRanking() {
    const [topUsers, setTopUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRanking = async () => {
            const { data } = await supabase
                .from('users')
                .select('*')
                .order('points', { ascending: false })
                .limit(10)

            setTopUsers(data || [])
            setLoading(false)
        }

        fetchRanking()
    }, [])

    return { topUsers, loading }
}
