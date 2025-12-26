import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { WeightLog } from '../lib/supabase'

export function useWeightLogs() {
    const [logs, setLogs] = useState<WeightLog[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLogs = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setLoading(false)
            return
        }

        const { data } = await supabase
            .from('weight_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('logged_at', { ascending: false })
            .limit(30)

        setLogs(data || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    const addLog = async (weight: number, notes?: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: new Error('Not authenticated') }

        const { error } = await supabase.from('weight_logs').insert({
            user_id: user.id,
            weight,
            notes
        })

        if (!error) {
            await fetchLogs()

            // Atualizar peso atual no perfil
            await supabase
                .from('users')
                .update({ current_weight: weight, updated_at: new Date().toISOString() })
                .eq('id', user.id)
        }

        return { error }
    }

    const getWeightChange = () => {
        if (logs.length < 2) return null
        const latest = logs[0].weight
        const previous = logs[1].weight
        return latest - previous
    }

    return { logs, loading, addLog, getWeightChange, refetch: fetchLogs }
}
