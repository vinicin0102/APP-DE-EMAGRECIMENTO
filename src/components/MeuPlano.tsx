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
            <header className="page-header">
                <h1>Meu Plano</h1>
            </header>

            <div className="page-container">
                <div className="plan-form-container">
                    {planStatus === 'active' && (
                        <div className="active-plan-banner">
                            <span className="icon">🏆</span>
                            <div>
                                <h4>Plano Ativo</h4>
                                <p>Expira em {daysRemaining} dias</p>
                            </div>
                        </div>
                    )}

                    {planStatus === 'overdue' && (
                        <div className="overdue-plan-banner">
                            <span className="icon">⚠️</span>
                            <div>
                                <h4>Plano Expirado</h4>
                                <p>Renove seu plano para continuar</p>
                            </div>
                        </div>
                    )}

                    <h3>{planStatus === 'none' ? 'Configurar Plano' : 'Atualizar Dados'}</h3>

                    <div className="plan-form">
                        <div className="form-field">
                            <label>Peso atual (kg)</label>
                            <input 
                                type="number" 
                                step="0.1" 
                                value={peso} 
                                onChange={(e) => setPeso(e.target.value)} 
                                placeholder="Ex: 65" 
                            />
                        </div>
                        <div className="form-field">
                            <label>Meta de peso (kg)</label>
                            <input 
                                type="number" 
                                step="0.1" 
                                value={metaPeso} 
                                onChange={(e) => setMetaPeso(e.target.value)} 
                                placeholder="Ex: 58" 
                            />
                        </div>
                        <div className="form-field">
                            <label>Local de Treino</label>
                            <select value={localTreino} onChange={(e) => setLocalTreino(e.target.value)}>
                                <option value="">Selecione...</option>
                                <option value="casa">🏠 Casa</option>
                                <option value="academia">🏋️ Academia</option>
                                <option value="ambos">🔄 Ambos</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Altura (cm)</label>
                            <input 
                                type="number" 
                                value={altura} 
                                onChange={(e) => setAltura(e.target.value)} 
                                placeholder="Ex: 165" 
                            />
                        </div>

                        <button
                            className="plan-btn primary"
                            onClick={handleSubmitPlan}
                            disabled={submitting}
                        >
                            {submitting ? 'Salvando...' : '💾 Salvar e Atualizar'}
                        </button>

                        {planStatus === 'overdue' && (
                            <button className="btn-renew" onClick={() => window.open(PAYMENT_LINK, '_blank')}>
                                🔄 Renovar Plano
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

