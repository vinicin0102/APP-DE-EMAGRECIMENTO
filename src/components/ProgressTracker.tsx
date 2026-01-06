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

interface Workout {
    id: string
    title: string
    description: string
    type: string
    duration: string
    difficulty: string
    exercises: Array<{ nome: string; series: number; repeticoes: string }>
    video_url?: string
}

// Link de pagamento - ALTERE PARA SEU LINK REAL
const PAYMENT_LINK = 'https://pay.hotmart.com/SEU_LINK_HOTMART'
const PLAN_PRICE = 29.90

export default function ProgressTracker() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [planStatus, setPlanStatus] = useState<'none' | 'active' | 'overdue'>('none')
    const [showForm, setShowForm] = useState(true)
    const [existingPlan, setExistingPlan] = useState<PlanData | null>(null)
    const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null)
    const [workoutCompleted, setWorkoutCompleted] = useState(false)
    const [daysRemaining, setDaysRemaining] = useState(0)
    const [showWorkoutDetails, setShowWorkoutDetails] = useState(false)
    const isMounted = useRef(true)

    // Form fields
    const [peso, setPeso] = useState('')
    const [metaPeso, setMetaPeso] = useState('')
    const [localTreino, setLocalTreino] = useState('')
    const [altura, setAltura] = useState('')

    useEffect(() => {
        isMounted.current = true
        const timeout = setTimeout(() => {
            if (isMounted.current && loading) {
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

            if (error) {
                setPlanStatus('none')
                setShowForm(true)
                setLoading(false)
                return
            }

            if (data) {
                setExistingPlan(data)
                const expiresAt = new Date(data.expires_at)
                const now = new Date()

                if (expiresAt < now) {
                    setPlanStatus('overdue')
                    setShowForm(false)
                } else {
                    setPlanStatus('active')
                    // Calcular dias restantes
                    const diffTime = expiresAt.getTime() - now.getTime()
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    setDaysRemaining(diffDays)

                    // Carregar treino do dia automaticamente
                    await loadTodayWorkout(data.local_treino)
                    setShowForm(false)
                }

                setPeso(data.peso?.toString() || '')
                setMetaPeso(data.meta_peso?.toString() || '')
                setLocalTreino(data.local_treino || '')
                setAltura(data.altura?.toString() || '')
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

    // Função para gerar um número pseudo-aleatório baseado na data
    // Isso garante que o mesmo treino apareça durante todo o dia
    const getDailyRandomIndex = (max: number, userId: string): number => {
        const today = new Date()
        const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}-${userId}`

        // Criar um hash simples da string
        let hash = 0
        for (let i = 0; i < dateString.length; i++) {
            const char = dateString.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32bit integer
        }

        return Math.abs(hash % max)
    }

    const loadTodayWorkout = async (workoutType: string) => {
        if (!user) return

        try {
            // Buscar todos os treinos ativos do tipo da usuária
            const { data: workouts, error } = await supabase
                .from('workouts')
                .select('*')
                .or(`type.eq.${workoutType},type.eq.ambos`)
                .eq('is_active', true)

            if (error || !workouts || workouts.length === 0) {
                console.warn('Nenhum treino disponível')
                return
            }

            // Selecionar treino do dia baseado na data (pseudo-aleatório)
            const todayIndex = getDailyRandomIndex(workouts.length, user.id)
            const selectedWorkout = workouts[todayIndex]

            setTodayWorkout(selectedWorkout)

            // Verificar se já completou hoje
            const today = new Date().toISOString().split('T')[0]
            const completionKey = `workout_completed_${user.id}_${today}`
            const isCompleted = localStorage.getItem(completionKey) === 'true'
            setWorkoutCompleted(isCompleted)

        } catch (err) {
            console.error('Erro ao carregar treino do dia:', err)
        }
    }

    const handleCompleteWorkout = () => {
        if (!user) return

        const today = new Date().toISOString().split('T')[0]
        const completionKey = `workout_completed_${user.id}_${today}`

        localStorage.setItem(completionKey, 'true')
        setWorkoutCompleted(true)
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

            // Redirecionar para pagamento
            window.open(PAYMENT_LINK, '_blank')

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
        window.open(PAYMENT_LINK, '_blank')
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
                <h1>🎯 Meu Plano</h1>
                <p>Seu treino individual do dia</p>
            </div>

            {/* Plan Card */}
            <div className="plan-card">
                {/* Active Plan - Treino do Dia */}
                {planStatus === 'active' && !showForm && (
                    <div className="plan-status-container">
                        <div className="plan-active-header">
                            <div className="plan-active-badge">
                                <span className="badge-icon">✓</span>
                                <span>Plano Ativo</span>
                            </div>
                            <div className="days-remaining">
                                <span className="days-number">{daysRemaining}</span>
                                <span className="days-label">dias restantes</span>
                            </div>
                        </div>

                        {/* Treino do Dia */}
                        {todayWorkout ? (
                            <div className="today-workout-section">
                                <h2 className="section-title">🔥 Seu Treino de Hoje</h2>

                                <div className={`today-workout-card ${workoutCompleted ? 'completed' : ''}`}>
                                    {workoutCompleted && (
                                        <div className="completed-overlay">
                                            <span className="completed-icon">✅</span>
                                            <span>Treino Concluído!</span>
                                        </div>
                                    )}

                                    <div className="workout-header">
                                        <h3>{todayWorkout.title}</h3>
                                        <div className="workout-badges">
                                            <span className={`badge type-${todayWorkout.type}`}>
                                                {todayWorkout.type === 'casa' ? '🏠 Casa' :
                                                    todayWorkout.type === 'academia' ? '🏋️ Academia' : '🔄 Ambos'}
                                            </span>
                                            <span className={`badge difficulty-${todayWorkout.difficulty}`}>
                                                {todayWorkout.difficulty === 'iniciante' ? '🟢 Iniciante' :
                                                    todayWorkout.difficulty === 'intermediario' ? '🟡 Intermediário' : '🔴 Avançado'}
                                            </span>
                                            <span className="badge duration">⏱ {todayWorkout.duration}</span>
                                        </div>
                                    </div>

                                    {todayWorkout.description && (
                                        <p className="workout-description">{todayWorkout.description}</p>
                                    )}

                                    <button
                                        className="btn-view-workout"
                                        onClick={() => setShowWorkoutDetails(true)}
                                    >
                                        👁️ Ver Exercícios
                                    </button>

                                    {!workoutCompleted && (
                                        <button
                                            className="btn-complete-workout"
                                            onClick={handleCompleteWorkout}
                                        >
                                            ✅ Marcar como Concluído
                                        </button>
                                    )}
                                </div>

                                <p className="workout-tip">
                                    💡 Um novo treino será liberado amanhã automaticamente!
                                </p>
                            </div>
                        ) : (
                            <div className="no-workout-message">
                                <span className="icon">📦</span>
                                <p>Nenhum treino disponível ainda.</p>
                                <p className="hint">Aguarde, estamos preparando seus treinos!</p>
                            </div>
                        )}

                        <button className="btn-edit-profile" onClick={() => setShowForm(true)}>
                            ✏️ Atualizar meus dados
                        </button>
                    </div>
                )}

                {/* Overdue Plan - Mensagem de Renovação */}
                {planStatus === 'overdue' && !showForm && (
                    <div className="plan-status-container overdue">
                        <div className="overdue-icon">⏰</div>
                        <h2 className="overdue-title">Seu plano expirou!</h2>
                        <p className="overdue-message">
                            Renove agora para continuar recebendo seus treinos personalizados diariamente.
                        </p>

                        <div className="renewal-benefits">
                            <h4>✨ Ao renovar você continua com:</h4>
                            <ul>
                                <li>🎯 1 treino novo por dia</li>
                                <li>📱 Acesso por mais 30 dias</li>
                                <li>💪 Treinos para {existingPlan?.local_treino === 'casa' ? 'casa' :
                                    existingPlan?.local_treino === 'academia' ? 'academia' : 'casa e academia'}</li>
                            </ul>
                        </div>

                        <button className="btn-renew" onClick={handleRenewPlan}>
                            🔄 Renovar por R$ {PLAN_PRICE.toFixed(2).replace('.', ',')}
                        </button>

                        <button className="btn-secondary-link" onClick={() => setShowForm(true)}>
                            Atualizar meus dados antes de renovar
                        </button>
                    </div>
                )}

                {/* Form - Novo Plano ou Atualização */}
                {(planStatus === 'none' || showForm) && (
                    <div className="plan-form-container">
                        {planStatus !== 'none' && (
                            <button className="back-btn" onClick={() => setShowForm(false)}>
                                ← Voltar
                            </button>
                        )}

                        <h2 className="plan-title">
                            {planStatus === 'none' ? 'Plano Individual' : 'Atualizar Dados'}
                        </h2>
                        <p className="plan-subtitle">
                            {planStatus === 'none'
                                ? 'Receba 1 treino personalizado por dia durante 30 dias!'
                                : 'Atualize suas informações para treinos mais precisos'}
                        </p>

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
                                <label>Onde você treina?</label>
                                <select
                                    value={localTreino}
                                    onChange={(e) => setLocalTreino(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="casa">🏠 Em casa</option>
                                    <option value="academia">🏋️ Na academia</option>
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
                        </div>

                        {planStatus === 'none' && (
                            <div className="plan-benefits">
                                <h4>O que você vai receber:</h4>
                                <ul>
                                    <li>✅ 1 treino diferente por dia</li>
                                    <li>✅ Exercícios para seu local de treino</li>
                                    <li>✅ Acesso por 30 dias</li>
                                    <li>✅ Novos treinos automaticamente</li>
                                </ul>
                            </div>
                        )}

                        <button
                            className="plan-btn primary"
                            onClick={handleSubmitPlan}
                            disabled={submitting || !peso || !metaPeso || !localTreino || !altura}
                        >
                            {submitting ? 'Processando...' :
                                planStatus === 'none'
                                    ? `Quero meu plano por R$ ${PLAN_PRICE.toFixed(2).replace('.', ',')}`
                                    : '💾 Salvar Alterações'}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de Detalhes do Treino */}
            {showWorkoutDetails && todayWorkout && (
                <div className="workout-modal-overlay" onClick={() => setShowWorkoutDetails(false)}>
                    <div className="workout-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowWorkoutDetails(false)}>×</button>

                        <h2>{todayWorkout.title}</h2>

                        {todayWorkout.description && (
                            <p className="workout-modal-description">{todayWorkout.description}</p>
                        )}

                        <div className="workout-modal-meta">
                            <span>⏱ {todayWorkout.duration}</span>
                            <span>💪 {todayWorkout.difficulty}</span>
                            <span>📍 {todayWorkout.type === 'casa' ? 'Em casa' :
                                todayWorkout.type === 'academia' ? 'Academia' : 'Ambos'}</span>
                        </div>

                        <h3>📋 Exercícios</h3>
                        <div className="exercises-list">
                            {todayWorkout.exercises?.map((ex, idx) => (
                                <div key={idx} className="exercise-item">
                                    <span className="exercise-number">{idx + 1}</span>
                                    <div className="exercise-info">
                                        <span className="exercise-name">{ex.nome}</span>
                                        <span className="exercise-sets">{ex.series}x {ex.repeticoes}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!workoutCompleted && (
                            <button
                                className="btn-complete-modal"
                                onClick={() => {
                                    handleCompleteWorkout()
                                    setShowWorkoutDetails(false)
                                }}
                            >
                                ✅ Concluir Treino
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
