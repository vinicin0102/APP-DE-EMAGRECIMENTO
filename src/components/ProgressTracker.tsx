import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './ProgressTracker.css'

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

export default function ProgressTracker() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [planStatus, setPlanStatus] = useState<'none' | 'active' | 'overdue'>('none')
    const [showForm, setShowForm] = useState(true) // Start with form visible
    const [existingPlan, setExistingPlan] = useState<PlanData | null>(null)
    const isMounted = useRef(true)

    // Form fields
    const [peso, setPeso] = useState('')
    const [metaPeso, setMetaPeso] = useState('')
    const [localTreino, setLocalTreino] = useState('')
    const [altura, setAltura] = useState('')

    useEffect(() => {
        isMounted.current = true

        // Safety timeout - force loading false after 3 seconds
        const timeout = setTimeout(() => {
            if (isMounted.current && loading) {
                console.warn('ProgressTracker: Timeout atingido, forçando carregamento')
                setLoading(false)
                setShowForm(true)
            }
        }, 3000)

        checkPlanStatus()

        return () => {
            isMounted.current = false
            clearTimeout(timeout)
        }
    }, [user])

    const checkPlanStatus = async () => {
        if (!user) {
            setLoading(false)
            setShowForm(true)
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

            // Handle table not existing or other errors
            if (error) {
                console.warn('Plano não encontrado ou tabela não existe:', error.message)
                setPlanStatus('none')
                setShowForm(true)
                setLoading(false)
                return
            }

            if (data) {
                setExistingPlan(data)
                // Check if plan is expired
                const expiresAt = new Date(data.expires_at)
                const now = new Date()
                if (expiresAt < now) {
                    setPlanStatus('overdue')
                } else {
                    setPlanStatus('active')
                }
                // Pre-fill form with existing data
                setPeso(data.peso?.toString() || '')
                setMetaPeso(data.meta_peso?.toString() || '')
                setLocalTreino(data.local_treino || '')
                setAltura(data.altura?.toString() || '')
                setShowForm(false)
            } else {
                setPlanStatus('none')
                setShowForm(true)
            }
        } catch (err) {
            console.error('Erro:', err)
            if (isMounted.current) {
                setPlanStatus('none')
                setShowForm(true)
            }
        } finally {
            if (isMounted.current) {
                setLoading(false)
            }
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
            // Calculate expiration (30 days from now)
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
                // Update existing plan
                await supabase
                    .from('individual_plans')
                    .update(planData)
                    .eq('id', existingPlan.id)
            } else {
                // Create new plan
                await supabase
                    .from('individual_plans')
                    .insert(planData)
            }

            // Redirect to payment (you can customize this URL)
            window.open('https://pay.hotmart.com/SEU_LINK_HOTMART', '_blank')

            // Refresh status
            await checkPlanStatus()
            setShowForm(false)
        } catch (err) {
            console.error('Erro ao salvar plano:', err)
            alert('Erro ao processar. Tente novamente.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleRenewPlan = () => {
        setShowForm(true)
    }

    if (loading) {
        return (
            <div className="progress-tracker">
                <div className="progress-loading">
                    <div className="loader-spinner"></div>
                    <p>Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="progress-tracker">
            {/* Header */}
            <div className="progress-header">
                <h1>🎯 Meu Progresso</h1>
                <p>Acompanhe sua evolução diária</p>
            </div>

            {/* Plan Card */}
            <div className="plan-card">
                {showForm && (
                    <button className="back-btn" onClick={() => setShowForm(false)}>
                        ←
                    </button>
                )}

                {/* Active Plan State */}
                {planStatus === 'active' && !showForm && (
                    <div className="plan-status-container">
                        <div className="plan-active-badge">
                            <span className="badge-icon">✓</span>
                            <span>Plano Ativo</span>
                        </div>
                        <h2 className="plan-title">Seu Plano Individual</h2>
                        <p className="plan-subtitle">
                            Seu plano personalizado está ativo até {existingPlan?.expires_at ?
                                new Date(existingPlan.expires_at).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>

                        <div className="plan-data-grid">
                            <div className="plan-data-item">
                                <span className="data-label">Peso Atual</span>
                                <span className="data-value">{existingPlan?.peso} kg</span>
                            </div>
                            <div className="plan-data-item">
                                <span className="data-label">Meta de Peso</span>
                                <span className="data-value">{existingPlan?.meta_peso} kg</span>
                            </div>
                            <div className="plan-data-item">
                                <span className="data-label">Local</span>
                                <span className="data-value">{existingPlan?.local_treino}</span>
                            </div>
                            <div className="plan-data-item">
                                <span className="data-label">Altura</span>
                                <span className="data-value">{existingPlan?.altura} cm</span>
                            </div>
                        </div>

                        <button className="plan-btn secondary" onClick={() => setShowForm(true)}>
                            Atualizar Dados
                        </button>
                    </div>
                )}

                {/* Overdue Plan State */}
                {planStatus === 'overdue' && !showForm && (
                    <div className="plan-status-container overdue">
                        <h2 className="plan-title overdue">Plano atrasado</h2>
                        <p className="plan-subtitle">
                            para gerar o seu plano do mês você precisa acertar o valor pendente
                        </p>

                        <div className="plan-form">
                            <div className="form-field">
                                <label>Peso</label>
                                <input
                                    type="number"
                                    value={peso}
                                    onChange={(e) => setPeso(e.target.value)}
                                    placeholder=""
                                    disabled
                                />
                            </div>

                            <div className="form-field">
                                <label>Meta de peso</label>
                                <input
                                    type="number"
                                    value={metaPeso}
                                    onChange={(e) => setMetaPeso(e.target.value)}
                                    placeholder=""
                                    disabled
                                />
                            </div>

                            <div className="form-field">
                                <label>Treina em casa ou academia</label>
                                <input
                                    type="text"
                                    value={localTreino}
                                    onChange={(e) => setLocalTreino(e.target.value)}
                                    placeholder=""
                                    disabled
                                />
                            </div>

                            <div className="form-field">
                                <label>Altura</label>
                                <input
                                    type="number"
                                    value={altura}
                                    onChange={(e) => setAltura(e.target.value)}
                                    placeholder=""
                                    disabled
                                />
                            </div>
                        </div>

                        <button className="plan-btn renew" onClick={handleRenewPlan}>
                            Voltar com plano individual
                        </button>
                    </div>
                )}

                {/* New Plan / Update Form */}
                {(planStatus === 'none' || showForm) && (
                    <div className="plan-form-container">
                        <h2 className="plan-title">Plano Individual</h2>
                        <p className="plan-subtitle">
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
                                    placeholder="Ex: 65"
                                />
                            </div>

                            <div className="form-field">
                                <label>Meta de peso</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={metaPeso}
                                    onChange={(e) => setMetaPeso(e.target.value)}
                                    placeholder="Ex: 58"
                                />
                            </div>

                            <div className="form-field">
                                <label>Treina em casa ou academia</label>
                                <select
                                    value={localTreino}
                                    onChange={(e) => setLocalTreino(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="casa">Em casa</option>
                                    <option value="academia">Na academia</option>
                                    <option value="ambos">Ambos</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label>Altura</label>
                                <input
                                    type="number"
                                    value={altura}
                                    onChange={(e) => setAltura(e.target.value)}
                                    placeholder="Ex: 165"
                                />
                            </div>
                        </div>

                        <button
                            className="plan-btn primary"
                            onClick={handleSubmitPlan}
                            disabled={submitting || !peso || !metaPeso || !localTreino || !altura}
                        >
                            {submitting ? 'Processando...' : 'Quero meu plano individual por apenas 29,90'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
