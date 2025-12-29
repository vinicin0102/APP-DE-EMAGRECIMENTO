import { useState, useEffect } from 'react'
import { useDailyLogs } from '../hooks/useDailyLogs'
import { useWeightLogs } from '../hooks/useWeightLogs'
import './ProgressTracker.css'

export default function ProgressTracker() {
    const {
        todayLog,
        consistencyStats,
        toggleCheck,
        getCalendarData,
        loading: logsLoading
    } = useDailyLogs()

    const { logs: weightLogs, addLog: addWeightLog, loading: weightLoading } = useWeightLogs()

    const [activeView, setActiveView] = useState<'today' | 'calendar' | 'weight'>('today')
    const [newWeight, setNewWeight] = useState('')
    const [weightNote, setWeightNote] = useState('')
    const [showWeightModal, setShowWeightModal] = useState(false)
    const [forceLoaded, setForceLoaded] = useState(false)

    // Timeout de segurança - força carregamento após 5 segundos
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (logsLoading || weightLoading) {
                console.warn('ProgressTracker: Timeout de loading atingido, forçando carregamento')
                setForceLoaded(true)
            }
        }, 5000)
        return () => clearTimeout(timeout)
    }, [logsLoading, weightLoading])

    const loading = (logsLoading || weightLoading) && !forceLoaded

    const handleToggle = async (field: 'ate_healthy' | 'trained' | 'drank_water') => {
        await toggleCheck(field)
    }

    const handleAddWeight = async () => {
        const weight = parseFloat(newWeight)
        if (isNaN(weight) || weight <= 0) return

        await addWeightLog(weight, weightNote || undefined)
        setNewWeight('')
        setWeightNote('')
        setShowWeightModal(false)
    }

    const calendarData = getCalendarData(30)

    // Calcular variação de peso
    const getWeightTrend = () => {
        if (weightLogs.length < 2) return null
        const latest = weightLogs[0]?.weight || 0
        const oldest = weightLogs[Math.min(weightLogs.length - 1, 6)]?.weight || latest
        return latest - oldest
    }

    const weightTrend = getWeightTrend()

    if (loading) {
        return (
            <div className="progress-tracker">
                <div className="progress-loading">
                    <div className="loader-spinner"></div>
                    <p>Carregando seu progresso...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="progress-tracker">
            {/* Header */}
            <div className="progress-header">
                <h1>📊 Meu Progresso</h1>
                <p>Acompanhe sua evolução diária</p>
            </div>

            {/* Navigation Tabs */}
            <div className="progress-tabs">
                <button
                    className={`tab-btn ${activeView === 'today' ? 'active' : ''}`}
                    onClick={() => setActiveView('today')}
                >
                    <span>✅</span> Hoje
                </button>
                <button
                    className={`tab-btn ${activeView === 'calendar' ? 'active' : ''}`}
                    onClick={() => setActiveView('calendar')}
                >
                    <span>📅</span> Calendário
                </button>
                <button
                    className={`tab-btn ${activeView === 'weight' ? 'active' : ''}`}
                    onClick={() => setActiveView('weight')}
                >
                    <span>⚖️</span> Peso
                </button>
            </div>

            {/* Today's Check-ins */}
            {activeView === 'today' && (
                <div className="today-section">
                    <div className="checklist-card">
                        <h2>Check-in de Hoje</h2>
                        <p className="checklist-subtitle">Marque o que você completou</p>

                        <div className="check-items">
                            <button
                                className={`check-item ${todayLog?.ate_healthy ? 'checked' : ''}`}
                                onClick={() => handleToggle('ate_healthy')}
                            >
                                <div className="check-icon">
                                    {todayLog?.ate_healthy ? '✅' : '🍎'}
                                </div>
                                <div className="check-info">
                                    <span className="check-title">Alimentação Saudável</span>
                                    <span className="check-desc">Comi bem hoje</span>
                                </div>
                                <div className={`check-toggle ${todayLog?.ate_healthy ? 'on' : ''}`}>
                                    <div className="toggle-circle"></div>
                                </div>
                            </button>

                            <button
                                className={`check-item ${todayLog?.trained ? 'checked' : ''}`}
                                onClick={() => handleToggle('trained')}
                            >
                                <div className="check-icon">
                                    {todayLog?.trained ? '✅' : '💪'}
                                </div>
                                <div className="check-info">
                                    <span className="check-title">Treino</span>
                                    <span className="check-desc">Me exercitei hoje</span>
                                </div>
                                <div className={`check-toggle ${todayLog?.trained ? 'on' : ''}`}>
                                    <div className="toggle-circle"></div>
                                </div>
                            </button>

                            <button
                                className={`check-item ${todayLog?.drank_water ? 'checked' : ''}`}
                                onClick={() => handleToggle('drank_water')}
                            >
                                <div className="check-icon">
                                    {todayLog?.drank_water ? '✅' : '💧'}
                                </div>
                                <div className="check-info">
                                    <span className="check-title">Hidratação</span>
                                    <span className="check-desc">Bebi água suficiente</span>
                                </div>
                                <div className={`check-toggle ${todayLog?.drank_water ? 'on' : ''}`}>
                                    <div className="toggle-circle"></div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Consistency Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">📅</div>
                            <div className="stat-value">{consistencyStats.week?.consistency_percentage || 0}%</div>
                            <div className="stat-label">Consistência Semanal</div>
                            <div className="stat-detail">
                                {consistencyStats.week?.days_with_all_checks || 0} de 7 dias completos
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🗓️</div>
                            <div className="stat-value">{consistencyStats.month?.consistency_percentage || 0}%</div>
                            <div className="stat-label">Consistência Mensal</div>
                            <div className="stat-detail">
                                {consistencyStats.month?.days_with_all_checks || 0} de 30 dias completos
                            </div>
                        </div>
                    </div>

                    {/* Quick Weight */}
                    <div className="quick-weight-card">
                        <div className="quick-weight-info">
                            <span className="qw-icon">⚖️</span>
                            <div>
                                <span className="qw-label">Último peso registrado</span>
                                <span className="qw-value">
                                    {weightLogs[0]?.weight ? `${weightLogs[0].weight} kg` : 'Não registrado'}
                                </span>
                            </div>
                        </div>
                        <button
                            className="qw-btn"
                            onClick={() => setShowWeightModal(true)}
                        >
                            + Registrar
                        </button>
                    </div>
                </div>
            )}

            {/* Calendar View */}
            {activeView === 'calendar' && (
                <div className="calendar-section">
                    <div className="calendar-card">
                        <h2>📅 Últimos 30 Dias</h2>
                        <p className="calendar-legend">
                            <span className="legend-item"><span className="dot full"></span> Completo</span>
                            <span className="legend-item"><span className="dot partial"></span> Parcial</span>
                            <span className="legend-item"><span className="dot empty"></span> Vazio</span>
                        </p>

                        <div className="calendar-grid">
                            {calendarData.map((day, index) => {
                                const date = new Date(day.date)
                                const dayNum = date.getDate()
                                let status = 'empty'
                                if (day.completed === 3) status = 'full'
                                else if (day.completed > 0) status = 'partial'

                                return (
                                    <div
                                        key={index}
                                        className={`calendar-day ${status}`}
                                        title={`${day.date}: ${day.completed}/3 completos`}
                                    >
                                        <span className="day-number">{dayNum}</span>
                                        <span className="day-dots">
                                            <span className={`dot ${day.completed >= 1 ? 'active' : ''}`}></span>
                                            <span className={`dot ${day.completed >= 2 ? 'active' : ''}`}></span>
                                            <span className={`dot ${day.completed >= 3 ? 'active' : ''}`}></span>
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Weight View */}
            {activeView === 'weight' && (
                <div className="weight-section">
                    <div className="weight-header-card">
                        <div className="weight-current">
                            <span className="weight-label">Peso Atual</span>
                            <span className="weight-value">
                                {weightLogs[0]?.weight ? `${weightLogs[0].weight} kg` : '--'}
                            </span>
                            {weightTrend !== null && (
                                <span className={`weight-trend ${weightTrend < 0 ? 'down' : weightTrend > 0 ? 'up' : ''}`}>
                                    {weightTrend > 0 ? '+' : ''}{weightTrend.toFixed(1)} kg
                                    {weightTrend < 0 ? ' 📉' : weightTrend > 0 ? ' 📈' : ''}
                                </span>
                            )}
                        </div>
                        <button
                            className="add-weight-btn"
                            onClick={() => setShowWeightModal(true)}
                        >
                            <span>+</span> Registrar Peso
                        </button>
                    </div>

                    {/* Weight Chart (Simple) */}
                    {weightLogs.length > 0 && (
                        <div className="weight-chart-card">
                            <h3>📈 Evolução do Peso</h3>
                            <div className="simple-chart">
                                {weightLogs.slice(0, 14).reverse().map((log, index) => {
                                    const minWeight = Math.min(...weightLogs.slice(0, 14).map(l => l.weight))
                                    const maxWeight = Math.max(...weightLogs.slice(0, 14).map(l => l.weight))
                                    const range = maxWeight - minWeight || 1
                                    const height = ((log.weight - minWeight) / range) * 80 + 20

                                    return (
                                        <div key={log.id} className="chart-bar-container">
                                            <div
                                                className="chart-bar"
                                                style={{ height: `${height}%` }}
                                                title={`${log.weight} kg - ${new Date(log.logged_at).toLocaleDateString()}`}
                                            >
                                                <span className="bar-value">{log.weight}</span>
                                            </div>
                                            <span className="bar-date">
                                                {new Date(log.logged_at).getDate()}/{new Date(log.logged_at).getMonth() + 1}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Weight History */}
                    <div className="weight-history-card">
                        <h3>📋 Histórico</h3>
                        {weightLogs.length === 0 ? (
                            <p className="no-data">Nenhum peso registrado ainda</p>
                        ) : (
                            <div className="weight-list">
                                {weightLogs.slice(0, 10).map((log, index) => (
                                    <div key={log.id} className="weight-item">
                                        <div className="weight-item-info">
                                            <span className="weight-item-value">{log.weight} kg</span>
                                            <span className="weight-item-date">
                                                {new Date(log.logged_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        {index > 0 && (
                                            <span className={`weight-item-diff ${log.weight < weightLogs[index - 1]?.weight ? 'positive' :
                                                log.weight > weightLogs[index - 1]?.weight ? 'negative' : ''
                                                }`}>
                                                {log.weight < weightLogs[index - 1]?.weight ? '↓' :
                                                    log.weight > weightLogs[index - 1]?.weight ? '↑' : '='}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Weight Modal */}
            {showWeightModal && (
                <div className="modal-overlay" onClick={() => setShowWeightModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowWeightModal(false)}>×</button>
                        <h2>⚖️ Registrar Peso</h2>

                        <div className="form-group">
                            <label>Peso (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="Ex: 65.5"
                                value={newWeight}
                                onChange={e => setNewWeight(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Observação (opcional)</label>
                            <textarea
                                placeholder="Como você está se sentindo?"
                                value={weightNote}
                                onChange={e => setWeightNote(e.target.value)}
                            />
                        </div>

                        <button
                            className="btn-save"
                            onClick={handleAddWeight}
                            disabled={!newWeight || parseFloat(newWeight) <= 0}
                        >
                            Salvar Registro
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
