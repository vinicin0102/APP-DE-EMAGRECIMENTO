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
}

interface UserWorkout {
    id: string
    day_of_week: number
    is_completed: boolean
    workout: Workout
}

const DAYS_OF_WEEK = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

export default function ProgressTracker() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [planStatus, setPlanStatus] = useState<'none' | 'active' | 'overdue'>('none')
    const [showForm, setShowForm] = useState(true)
    const [existingPlan, setExistingPlan] = useState<PlanData | null>(null)
    const [userWorkouts, setUserWorkouts] = useState<UserWorkout[]>([])
    const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
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
                } else {
                    setPlanStatus('active')
                    // Carregar treinos do usuário
                    await loadUserWorkouts()
                }

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

    const loadUserWorkouts = async () => {
        if (!user) return

        try {
            const currentMonth = new Date()
            currentMonth.setDate(1)
            currentMonth.setHours(0, 0, 0, 0)

            const { data, error } = await supabase
                .from('user_workouts')
                .select(`
                    id,
                    day_of_week,
                    is_completed,
                    workout:workouts(*)
                `)
                .eq('user_id', user.id)
                .order('day_of_week', { ascending: true })

            if (!error && data) {
                setUserWorkouts(data as any)
            }
        } catch (err) {
            console.error('Erro ao carregar treinos:', err)
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

            // Gerar treinos sorteados para o usuário
            await generateWorkoutsForUser(localTreino)

            // Redirecionar para pagamento
            window.open('https://pay.hotmart.com/SEU_LINK_HOTMART', '_blank')

            await checkPlanStatus()
            setShowForm(false)
        } catch (err) {
            console.error('Erro ao salvar plano:', err)
            alert('Erro ao processar. Tente novamente.')
        } finally {
            setSubmitting(false)
        }
    }

    const generateWorkoutsForUser = async (workoutType: string) => {
        if (!user) return

        try {
            // Buscar treinos disponíveis do tipo escolhido
            const { data: workouts } = await supabase
                .from('workouts')
                .select('id')
                .or(`type.eq.${workoutType},type.eq.ambos`)
                .eq('is_active', true)

            if (!workouts || workouts.length === 0) {
                console.warn('Nenhum treino disponível')
                return
            }

            // Deletar treinos anteriores
            await supabase
                .from('user_workouts')
                .delete()
                .eq('user_id', user.id)

            // Sortear e atribuir treinos para cada dia (Seg-Sáb)
            const currentMonth = new Date()
            currentMonth.setDate(1)
            currentMonth.setHours(0, 0, 0, 0)

            const assignments = []
            for (let day = 1; day <= 6; day++) {
                const randomIndex = Math.floor(Math.random() * workouts.length)
                assignments.push({
                    user_id: user.id,
                    workout_id: workouts[randomIndex].id,
                    day_of_week: day,
                    plan_month: currentMonth.toISOString().split('T')[0]
                })
            }

            await supabase.from('user_workouts').insert(assignments)
            await loadUserWorkouts()
        } catch (err) {
            console.error('Erro ao gerar treinos:', err)
        }
    }

    const toggleWorkoutComplete = async (workoutId: string, currentStatus: boolean) => {
        try {
            await supabase
                .from('user_workouts')
                .update({
                    is_completed: !currentStatus,
                    completed_at: !currentStatus ? new Date().toISOString() : null
                })
                .eq('id', workoutId)

            setUserWorkouts(prev => prev.map(w =>
                w.id === workoutId ? { ...w, is_completed: !currentStatus } : w
            ))
        } catch (err) {
            console.error('Erro:', err)
        }
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
                <p>Seu plano individual de treinos</p>
            </div>

            {/* Plan Card */}
            <div className="plan-card">
                {showForm && planStatus !== 'none' && (
                    <button className="back-btn" onClick={() => setShowForm(false)}>
                        ←
                    </button>
                )}

                {/* Active Plan State - Mostrar Treinos */}
                {planStatus === 'active' && !showForm && (
                    <div className="plan-status-container">
                        <div className="plan-active-badge">
                            <span className="badge-icon">✓</span>
                            <span>Plano Ativo</span>
                        </div>
                        <h2 className="plan-title">Seus Treinos da Semana</h2>
                        <p className="plan-subtitle">
                            Válido até {existingPlan?.expires_at ?
                                new Date(existingPlan.expires_at).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>

                        {/* Lista de Treinos por Dia */}
                        <div className="workouts-list">
                            {userWorkouts.length > 0 ? (
                                userWorkouts.map((uw) => (
                                    <div
                                        key={uw.id}
                                        className={`workout-day-card ${uw.is_completed ? 'completed' : ''}`}
                                    >
                                        <div className="workout-day-header">
                                            <span className="day-name">{DAYS_OF_WEEK[uw.day_of_week]}</span>
                                            <button
                                                className={`check-btn ${uw.is_completed ? 'checked' : ''}`}
                                                onClick={() => toggleWorkoutComplete(uw.id, uw.is_completed)}
                                            >
                                                {uw.is_completed ? '✓' : '○'}
                                            </button>
                                        </div>
                                        <div
                                            className="workout-info"
                                            onClick={() => setSelectedWorkout(uw.workout)}
                                        >
                                            <h4>{uw.workout?.title || 'Treino'}</h4>
                                            <div className="workout-meta">
                                                <span>⏱ {uw.workout?.duration || '30 min'}</span>
                                                <span>💪 {uw.workout?.difficulty || 'Médio'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-workouts">
                                    <p>Nenhum treino atribuído ainda.</p>
                                    <button
                                        className="plan-btn secondary"
                                        onClick={() => generateWorkoutsForUser(existingPlan?.local_treino || 'casa')}
                                    >
                                        Gerar Treinos
                                    </button>
                                </div>
                            )}
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
                        <button className="plan-btn renew" onClick={() => setShowForm(true)}>
                            Voltar com plano individual
                        </button>
                    </div>
                )}

                {/* New Plan / Update Form */}
                {(planStatus === 'none' || showForm) && (
                    <div className="plan-form-container">
                        <h2 className="plan-title">Plano Individual</h2>
                        <p className="plan-subtitle">
                            Tenha um plano individual de treino personalizado - atualiza mensalmente
                        </p>

                        <div className="plan-form">
                            <div className="form-field">
                                <label>Peso (kg)</label>
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
                                    <option value="casa">Em casa</option>
                                    <option value="academia">Na academia</option>
                                    <option value="ambos">Ambos</option>
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

                        <button
                            className="plan-btn primary"
                            onClick={handleSubmitPlan}
                            disabled={submitting || !peso || !metaPeso || !localTreino || !altura}
                        >
                            {submitting ? 'Processando...' : 'Quero meu plano por R$ 29,90'}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de Detalhes do Treino */}
            {selectedWorkout && (
                <div className="workout-modal-overlay" onClick={() => setSelectedWorkout(null)}>
                    <div className="workout-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedWorkout(null)}>×</button>
                        <h2>{selectedWorkout.title}</h2>
                        <p className="workout-description">{selectedWorkout.description}</p>

                        <div className="workout-details">
                            <span>⏱ {selectedWorkout.duration}</span>
                            <span>💪 {selectedWorkout.difficulty}</span>
                            <span>📍 {selectedWorkout.type === 'casa' ? 'Em casa' : selectedWorkout.type === 'academia' ? 'Academia' : 'Ambos'}</span>
                        </div>

                        <h3>Exercícios</h3>
                        <div className="exercises-list">
                            {selectedWorkout.exercises?.map((ex, idx) => (
                                <div key={idx} className="exercise-item">
                                    <span className="exercise-name">{ex.nome}</span>
                                    <span className="exercise-sets">{ex.series}x {ex.repeticoes}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
