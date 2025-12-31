import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { WeightLog } from '../lib/supabase'

export function useWeightLogs() {
    const [logs, setLogs] = useState<WeightLog[]>([])
    const [loading, setLoading] = useState(true)
    const isMounted = useRef(true)

    const fetchLogs = async () => {
        if (!isMounted.current) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                if (isMounted.current) setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('weight_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('logged_at', { ascending: false })
                .limit(30)

            if (!isMounted.current) return

            if (error) {
                console.warn('Tabela weight_logs não encontrada ou erro:', error.message)
                setLogs([])
            } else {
                setLogs(data || [])
            }
        } catch (error) {
            console.error('Erro ao buscar logs de peso:', error)
            if (isMounted.current) {
                setLogs([])
            }
        } finally {
            if (isMounted.current) {
                setLoading(false)
            }
        }
    }

    useEffect(() => {
        isMounted.current = true
        fetchLogs()

        // Timeout de segurança - força loading false após 6 segundos
        const safetyTimeout = setTimeout(() => {
            if (isMounted.current) {
                setLoading(false)
            }
        }, 6000)

        return () => {
            isMounted.current = false
            clearTimeout(safetyTimeout)
        }
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
