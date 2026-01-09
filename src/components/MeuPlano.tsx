import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useWeightLogs } from '../hooks/useWeightLogs'
import './MeuPlano.css'

interface PlanData {
    id?: string
    user_id: string
    peso: number
    meta_peso: number
    local_treino: string
    altura: number
    status: 'active' | 'overdue' | 'pending'
    expires_at?: string
    created_at?: string
}

const PAYMENT_LINK = 'https://pay.hotmart.com/SEU_LINK_HOTMART'

export default function MeuPlano() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [planStatus, setPlanStatus] = useState<'none' | 'active' | 'overdue'>('none')
    const [existingPlan, setExistingPlan] = useState<PlanData | null>(null)
    const [daysRemaining, setDaysRemaining] = useState(0)

    // Form fields for Plan
    const [peso, setPeso] = useState('')
    const [metaPeso, setMetaPeso] = useState('')
    const [localTreino, setLocalTreino] = useState('')
    const [altura, setAltura] = useState('')

    const { addLog } = useWeightLogs()
    const isMounted = useRef(true)

    // Initial Data Fetch
    useEffect(() => {
        isMounted.current = true
        checkPlanStatus()

        return () => {
            isMounted.current = false
        }
    }, [user])

    const checkPlanStatus = async () => {
        if (!user) {
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('individual_plans')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (!isMounted.current) return

            if (error) {
                setPlanStatus('none')
                setLoading(false)
                return
            }

            if (data) {
                setExistingPlan(data)
                const expiresAt = new Date(data.expires_at)
                const now = new Date()

                if (expiresAt < now) {
                    setPlanStatus('overdue')
                } else {
                    setPlanStatus('active')
                    const diffTime = expiresAt.getTime() - now.getTime()
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    setDaysRemaining(diffDays)
                }

                setPeso(data.peso?.toString() || '')
                setMetaPeso(data.meta_peso?.toString() || '')
                setLocalTreino(data.local_treino || '')
                setAltura(data.altura?.toString() || '')
            } else {
                setPlanStatus('none')
            }
        } catch (err) {
            console.error('Erro:', err)
            if (isMounted.current) setPlanStatus('none')
        } finally {
            if (isMounted.current) setLoading(false)
        }
    }

    const handleSubmitPlan = async () => {
        if (!user) return
        if (!peso || !metaPeso || !localTreino || !altura) {
            alert('Por favor, preencha todos os campos')
            return
        }

        setSubmitting(true)
        try {
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 30)

            const planData = {
                user_id: user.id,
                peso: parseFloat(peso),
                meta_peso: parseFloat(metaPeso),
                local_treino: localTreino,
                altura: parseFloat(altura),
                status: 'active',
                expires_at: expiresAt.toISOString()
            }

            if (existingPlan?.id) {
                await supabase
                    .from('individual_plans')
                    .update(planData)
                    .eq('id', existingPlan.id)
            } else {
                await supabase
                    .from('individual_plans')
                    .insert(planData)
            }

            // Also log weight to history
            if (peso) {
                await addLog(parseFloat(peso))
            }

            window.open(PAYMENT_LINK, '_blank')
            await checkPlanStatus()
            alert('✅ Plano atualizado com sucesso!')
        } catch (err) {
            console.error('Erro:', err)
            alert('Erro ao processar. Tente novamente.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div className="loading-container"><div className="loader-spinner"></div></div>
    }

    return (
        <div className="meu-plano-page">
            <header className="plano-page-header">
                <div className="header-content">
                    <h1>Meu Progresso</h1>
                    <p className="header-subtitle">Acompanhe sua evolução diária</p>
                </div>
            </header>

            <div className="page-container">
                <div className="plan-card-white">
                    <button className="back-button-card" onClick={() => window.history.back()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    
                    <h2 className="plan-card-title">Plano Individual</h2>
                    
                    <p className="plan-description">
                        Tenha um plano individual de treino e aulas personalizadas para alcançar seus resultados - atualiza mensalmente
                    </p>

                    <div className="plan-form">
                        <div className="form-field">
                            <label>Peso</label>
                            <input 
                                type="number" 
                                step="0.1" 
                                value={peso} 
                                onChange={(e) => setPeso(e.target.value)} 
                                placeholder="" 
                            />
                        </div>
                        <div className="form-field">
                            <label>Meta de peso</label>
                            <input 
                                type="number" 
                                step="0.1" 
                                value={metaPeso} 
                                onChange={(e) => setMetaPeso(e.target.value)} 
                                placeholder="" 
                            />
                        </div>
                        <div className="form-field">
                            <label>Treina em casa ou academia</label>
                            <select value={localTreino} onChange={(e) => setLocalTreino(e.target.value)}>
                                <option value="">Selecione...</option>
                                <option value="casa">Casa</option>
                                <option value="academia">Academia</option>
                                <option value="ambos">Ambos</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Altura</label>
                            <input 
                                type="number" 
                                value={altura} 
                                onChange={(e) => setAltura(e.target.value)} 
                                placeholder="" 
                            />
                        </div>

                        <button
                            className="plan-cta-button"
                            onClick={handleSubmitPlan}
                            disabled={submitting}
                        >
                            {submitting ? 'Processando...' : 'Quero meu plano individual por apenas 29,90'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

