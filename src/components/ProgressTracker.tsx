import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useDailyLogs } from '../hooks/useDailyLogs'
import { useWeightLogs } from '../hooks/useWeightLogs'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
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

const PAYMENT_LINK = 'https://pay.hotmart.com/SEU_LINK_HOTMART'

export default function ProgressTracker() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'evolution' | 'plan'>('today')

    // Existing Plan Logic State
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [planStatus, setPlanStatus] = useState<'none' | 'active' | 'overdue'>('none')
    const [existingPlan, setExistingPlan] = useState<PlanData | null>(null)
    const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null)
    const [workoutCompleted, setWorkoutCompleted] = useState(false)
    const [daysRemaining, setDaysRemaining] = useState(0)
    const [showWorkoutDetails, setShowWorkoutDetails] = useState(false)

    // Form fields for Plan
    const [peso, setPeso] = useState('')
    const [metaPeso, setMetaPeso] = useState('')
    const [localTreino, setLocalTreino] = useState('')
    const [altura, setAltura] = useState('')

    // Hooks for new features
    const {
        todayLog,
        toggleCheck,
        getCalendarData,
        consistencyStats
    } = useDailyLogs()

    const {
        logs: weightLogs,
        loading: loadingWeight
    } = useWeightLogs()

    const isMounted = useRef(true)

    // Initial Data Fetch
    useEffect(() => {
        isMounted.current = true
        checkPlanStatus()

        return () => {
            isMounted.current = false
        }
    }, [user])

    // Sync local storage completion with DB daily log
    useEffect(() => {
        if (workoutCompleted && todayLog && !todayLog.trained) {
            // If marked as completed in local storage but not in DB, sync it
            toggleCheck('trained')
        }
    }, [workoutCompleted])

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
                    await loadTodayWorkout(data.local_treino)
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

    const getDailyRandomIndex = (max: number, userId: string): number => {
        const today = new Date()
        const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}-${userId}`
        let hash = 0
        for (let i = 0; i < dateString.length; i++) {
            const char = dateString.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash
        }
        return Math.abs(hash % max)
    }

    const loadTodayWorkout = async (workoutType: string) => {
        if (!user) return

        try {
            const { data: workouts, error } = await supabase
                .from('workouts')
                .select('*')
                .or(`type.eq.${workoutType},type.eq.ambos`)
                .eq('is_active', true)

            if (error || !workouts || workouts.length === 0) return

            const todayIndex = getDailyRandomIndex(workouts.length, user.id)
            setTodayWorkout(workouts[todayIndex])

            const today = new Date().toISOString().split('T')[0]
            const completionKey = `workout_completed_${user.id}_${today}`
            const isCompleted = localStorage.getItem(completionKey) === 'true'
            setWorkoutCompleted(isCompleted)

        } catch (err) {
            console.error('Erro ao carregar treino:', err)
        }
    }

    const handleCompleteWorkout = () => {
        if (!user) return
        const today = new Date().toISOString().split('T')[0]
        const completionKey = `workout_completed_${user.id}_${today}`
        localStorage.setItem(completionKey, 'true')
        setWorkoutCompleted(true)

        // Also update daily log
        if (!todayLog?.trained) {
            toggleCheck('trained')
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

            window.open(PAYMENT_LINK, '_blank')
            await checkPlanStatus()
            setActiveTab('today')
        } catch (err) {
            console.error('Erro:', err)
            alert('Erro ao processar. Tente novamente.')
        } finally {
            setSubmitting(false)
        }
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        // Adjust for timezone offset to prevent showing wrong day
        const userTimezoneOffset = date.getTimezoneOffset() * 60000
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset)
        return `${adjustedDate.getDate()}/${adjustedDate.getMonth() + 1}`
    }

    const calendarData = getCalendarData(30) // Last 30 days

    if (loading) {
        return <div className="loading-container"><div className="loader-spinner"></div></div>
    }

    return (
        <div className="progress-page">
            <header className="progress-header-nav">
                <h1>Meu Progresso</h1>
                <div className="progress-tabs-container">
                    <div className="progress-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
                            onClick={() => setActiveTab('today')}
                        >
                            📅 Hoje
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
                            onClick={() => setActiveTab('calendar')}
                        >
                            🗓️ Histórico
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'evolution' ? 'active' : ''}`}
                            onClick={() => setActiveTab('evolution')}
                        >
                            📈 Evolução
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
                            onClick={() => setActiveTab('plan')}
                        >
                            ⚙️ Plano
                        </button>
                    </div>
                </div>
            </header>

            <div className="progress-content">
                {/* TAB: TODAY */}
                {activeTab === 'today' && (
                    <div className="tab-pane fade-in">
                        {/* Daily Stats Summary */}
                        <div className="daily-stats-cards">
                            <div className="stat-mini-card">
                                <span className="stat-icon-circle">🔥</span>
                                <div className="stat-info">
                                    <span className="stat-label">Consistência</span>
                                    <span className="stat-value">{consistencyStats.month?.consistency_percentage || 0}%</span>
                                </div>
                            </div>
                            <div className="stat-mini-card">
                                <span className="stat-icon-circle">✨</span>
                                <div className="stat-info">
                                    <span className="stat-label">Dias no Foco</span>
                                    <span className="stat-value">{consistencyStats.month?.days_with_all_checks || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Daily Checklist */}
                        <div className="daily-checklist-card">
                            <h3>✅ Metas de Hoje</h3>
                            <div className="checklist-items">
                                <button
                                    className={`check-item ${todayLog?.ate_healthy ? 'checked' : ''}`}
                                    onClick={() => toggleCheck('ate_healthy')}
                                >
                                    <div className="check-status">
                                        {todayLog?.ate_healthy ? '✓' : ''}
                                    </div>
                                    <div className="check-content">
                                        <span className="check-title">Alimentação Saudável</span>
                                        <span className="check-desc">Segui a dieta hoje</span>
                                    </div>
                                    <span className="check-emoji">🥗</span>
                                </button>

                                <button
                                    className={`check-item ${todayLog?.drank_water ? 'checked' : ''}`}
                                    onClick={() => toggleCheck('drank_water')}
                                >
                                    <div className="check-status">
                                        {todayLog?.drank_water ? '✓' : ''}
                                    </div>
                                    <div className="check-content">
                                        <span className="check-title">Hidratação</span>
                                        <span className="check-desc">Bebi a meta de água</span>
                                    </div>
                                    <span className="check-emoji">💧</span>
                                </button>

                                <button
                                    className={`check-item ${todayLog?.trained ? 'checked' : ''}`}
                                    onClick={() => toggleCheck('trained')}
                                >
                                    <div className="check-status">
                                        {todayLog?.trained ? '✓' : ''}
                                    </div>
                                    <div className="check-content">
                                        <span className="check-title">Treino Realizado</span>
                                        <span className="check-desc">Fiz meu exercício</span>
                                    </div>
                                    <span className="check-emoji">💪</span>
                                </button>
                            </div>
                        </div>

                        {/* Workout Plan Section */}
                        {planStatus === 'active' ? (
                            todayWorkout ? (
                                <div className="today-workout-section">
                                    <div className="section-header">
                                        <h3>🔥 Treino do Dia</h3>
                                        {workoutCompleted && <span className="completed-badge">Concluído</span>}
                                    </div>

                                    <div className={`workout-card-daily ${workoutCompleted ? 'completed-card' : ''}`}>
                                        <div className="workout-daily-header">
                                            <h4>{todayWorkout.title}</h4>
                                            <div className="workout-badges-row">
                                                <span className="badge">⏱ {todayWorkout.duration}</span>
                                                <span className="badge">💪 {todayWorkout.difficulty}</span>
                                            </div>
                                        </div>

                                        <button
                                            className="btn-view-details"
                                            onClick={() => setShowWorkoutDetails(true)}
                                        >
                                            Ver Detalhes do Treino
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="info-card">
                                    <span className="info-emoji">😴</span>
                                    <p>Nenhum treino específico para hoje. Aproveite para descansar ou fazer uma caminhada!</p>
                                </div>
                            )
                        ) : (
                            <div className="plan-alert-card">
                                <div className="alert-content">
                                    <h3>🚀 Turbine seus resultados!</h3>
                                    <p>Ative seu plano personalizado para receber treinos diários focados no seu objetivo.</p>
                                    <button className="btn-activate" onClick={() => setActiveTab('plan')}>
                                        Ativar Meu Plano
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: CALENDAR */}
                {activeTab === 'calendar' && (
                    <div className="tab-pane fade-in">
                        <div className="calendar-container">
                            <h3>🗓️ Histórico (30 dias)</h3>
                            <p className="calendar-subtitle">Cada círculo representa um dia. Quanto mais cheio, mais metas você cumpriu!</p>

                            <div className="calendar-grid">
                                {calendarData.map((day, idx) => (
                                    <div key={idx} className="calendar-day-wrapper">
                                        <div
                                            className={`day-circle intensity-${day.completed}`}
                                        >
                                            {day.date.split('-')[2]}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="calendar-legend">
                                <div className="legend-item"><div className="dot intensity-0"></div> 0%</div>
                                <div className="legend-item"><div className="dot intensity-1"></div> 33%</div>
                                <div className="legend-item"><div className="dot intensity-2"></div> 66%</div>
                                <div className="legend-item"><div className="dot intensity-3"></div> 100%</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: EVOLUTION */}
                {activeTab === 'evolution' && (
                    <div className="tab-pane fade-in">
                        <div className="chart-container">
                            <h3>📉 Sua Evolução</h3>
                            {loadingWeight ? (
                                <div className="loader-spinner"></div>
                            ) : weightLogs.length > 0 ? (
                                <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={[...weightLogs].reverse()}>
                                            <defs>
                                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ff4081" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#ff4081" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis
                                                dataKey="logged_at"
                                                tickFormatter={(str) => formatDate(str)}
                                                stroke="#999"
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis
                                                domain={['dataMin - 2', 'dataMax + 2']}
                                                hide={false}
                                                stroke="#999"
                                                tick={{ fontSize: 12 }}
                                            />
                                            <Tooltip
                                                labelFormatter={(label) => formatDate(label as string)}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="weight"
                                                stroke="#ff4081"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorWeight)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <span className="empty-emoji">⚖️</span>
                                    <p>Ainda não temos registros suficientes.</p>
                                    <p>Registre seu peso no Perfil regularmente para ver o gráfico ser construído!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: PLAN (Existing Form) */}
                {activeTab === 'plan' && (
                    <div className="tab-pane fade-in">
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

                            <h3>{planStatus === 'none' ? 'Configurar Plano' : 'Atualizar Dados'}</h3>

                            <div className="plan-form">
                                <div className="form-field">
                                    <label>Peso atual (kg)</label>
                                    <input type="number" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="Ex: 65" />
                                </div>
                                <div className="form-field">
                                    <label>Meta de peso (kg)</label>
                                    <input type="number" step="0.1" value={metaPeso} onChange={(e) => setMetaPeso(e.target.value)} placeholder="Ex: 58" />
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
                                    <input type="number" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="Ex: 165" />
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
                )}
            </div>

            {/* Workout Details Modal */}
            {showWorkoutDetails && todayWorkout && (
                <div className="workout-modal-overlay" onClick={() => setShowWorkoutDetails(false)}>
                    <div className="workout-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowWorkoutDetails(false)}>×</button>
                        <h2>{todayWorkout.title}</h2>
                        {todayWorkout.description && <p className="workout-modal-description">{todayWorkout.description}</p>}

                        <div className="workout-modal-meta">
                            <span>⏱ {todayWorkout.duration}</span>
                            <span>💪 {todayWorkout.difficulty}</span>
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
