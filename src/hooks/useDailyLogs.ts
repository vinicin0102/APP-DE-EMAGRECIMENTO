import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface DailyLog {
    id: string
    user_id: string
    log_date: string
    ate_healthy: boolean
    trained: boolean
    drank_water: boolean
    notes?: string
    created_at: string
    updated_at: string
}

export interface ConsistencyStats {
    total_days: number
    days_with_all_checks: number
    consistency_percentage: number
}

export function useDailyLogs() {
    const [todayLog, setTodayLog] = useState<DailyLog | null>(null)
    const [weekLogs, setWeekLogs] = useState<DailyLog[]>([])
    const [monthLogs, setMonthLogs] = useState<DailyLog[]>([])
    const [loading, setLoading] = useState(true)
    const [consistencyStats, setConsistencyStats] = useState<{
        week: ConsistencyStats | null
        month: ConsistencyStats | null
    }>({ week: null, month: null })

    const today = new Date().toISOString().split('T')[0]

    const fetchLogs = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            // Buscar log de hoje
            const { data: todayData } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .eq('log_date', today)
                .single()

            setTodayLog(todayData)

            // Buscar logs da semana (últimos 7 dias)
            const weekStart = new Date()
            weekStart.setDate(weekStart.getDate() - 6)
            const { data: weekData } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('log_date', weekStart.toISOString().split('T')[0])
                .order('log_date', { ascending: false })

            setWeekLogs(weekData || [])

            // Buscar logs do mês (últimos 30 dias)
            const monthStart = new Date()
            monthStart.setDate(monthStart.getDate() - 29)
            const { data: monthData } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('log_date', monthStart.toISOString().split('T')[0])
                .order('log_date', { ascending: false })

            setMonthLogs(monthData || [])

            // Calcular estatísticas de consistência
            calculateConsistency(weekData || [], monthData || [])

        } catch (error) {
            console.error('Erro ao buscar logs diários:', error)
        } finally {
            setLoading(false)
        }
    }, [today])

    const calculateConsistency = (weekData: DailyLog[], monthData: DailyLog[]) => {
        // Consistência da semana
        const weekComplete = weekData.filter(log =>
            log.ate_healthy && log.trained && log.drank_water
        ).length

        // Consistência do mês
        const monthComplete = monthData.filter(log =>
            log.ate_healthy && log.trained && log.drank_water
        ).length

        setConsistencyStats({
            week: {
                total_days: 7,
                days_with_all_checks: weekComplete,
                consistency_percentage: Math.round((weekComplete / 7) * 100)
            },
            month: {
                total_days: 30,
                days_with_all_checks: monthComplete,
                consistency_percentage: Math.round((monthComplete / 30) * 100)
            }
        })
    }

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    const updateTodayLog = async (updates: Partial<Pick<DailyLog, 'ate_healthy' | 'trained' | 'drank_water' | 'notes'>>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return { error: new Error('Not authenticated') }

            if (todayLog) {
                // Atualizar log existente
                const { error } = await supabase
                    .from('daily_logs')
                    .update({ ...updates, updated_at: new Date().toISOString() })
                    .eq('id', todayLog.id)

                if (error) return { error }
            } else {
                // Criar novo log
                const { error } = await supabase
                    .from('daily_logs')
                    .insert({
                        user_id: user.id,
                        log_date: today,
                        ate_healthy: false,
                        trained: false,
                        drank_water: false,
                        ...updates
                    })

                if (error) return { error }
            }

            await fetchLogs()
            return { error: null }
        } catch (error) {
            return { error }
        }
    }

    const toggleCheck = async (field: 'ate_healthy' | 'trained' | 'drank_water') => {
        const currentValue = todayLog?.[field] || false
        return updateTodayLog({ [field]: !currentValue })
    }

    // Gerar dados para o calendário visual
    const getCalendarData = (days: number = 30) => {
        const data: { date: string; completed: number; total: number }[] = []
        const logsMap = new Map(monthLogs.map(log => [log.log_date, log]))

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            const log = logsMap.get(dateStr)

            let completed = 0
            if (log) {
                if (log.ate_healthy) completed++
                if (log.trained) completed++
                if (log.drank_water) completed++
            }

            data.push({
                date: dateStr,
                completed,
                total: 3
            })
        }

        return data
    }

    return {
        todayLog,
        weekLogs,
        monthLogs,
        loading,
        consistencyStats,
        updateTodayLog,
        toggleCheck,
        getCalendarData,
        refetch: fetchLogs
    }
}
