import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWeightLogs } from '../hooks/useWeightLogs'
import './ProfilePage.css'

export default function ProfilePage() {
    const { profile, signOut, updateProfile } = useAuth()
    const { logs, addLog, getWeightChange } = useWeightLogs()
    const [activeSection, setActiveSection] = useState<'overview' | 'weight' | 'settings'>('overview')

    // Estados de edição
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(profile?.name || '')
    const [weightGoal, setWeightGoal] = useState(profile?.weight_goal?.toString() || '')
    const [saving, setSaving] = useState(false)

    // Modal de peso
    const [showWeightModal, setShowWeightModal] = useState(false)
    const [newWeight, setNewWeight] = useState('')
    const [addingWeight, setAddingWeight] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        await updateProfile({
            name,
            weight_goal: weightGoal ? parseFloat(weightGoal) : undefined
        })
        setSaving(false)
        setEditing(false)
    }

    const handleAddWeight = async () => {
        if (!newWeight) return
        setAddingWeight(true)
        await addLog(parseFloat(newWeight))
        setNewWeight('')
        setShowWeightModal(false)
        setAddingWeight(false)
    }

    const weightChange = getWeightChange()
    const progress = profile?.weight_goal && profile?.current_weight
        ? Math.round(((profile.current_weight - profile.weight_goal) / (profile.current_weight)) * 100)
        : 0

    return (
        <div className="profile-page-container">
            <header className="page-header page-header-with-action">
                <h1>Perfil</h1>
                <button className="settings-btn" onClick={() => setActiveSection(activeSection === 'settings' ? 'overview' : 'settings')}>
                    ⚙️
                </button>
            </header>

            <div className="page-container">
                {/* Profile Header */}
                <div className="profile-header-card">
                    <div className="profile-avatar-large">
                        {profile?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <h2>{profile?.name || 'Usuário'}</h2>
                    <p>{profile?.email}</p>
                    <div className="profile-badges-row">
                        <span className="badge-pill">{profile?.streak_days || 0} dias de sequência</span>
                        <span className="badge-pill">{profile?.points || 0} pontos</span>
                    </div>
                </div>

                {/* Section Tabs */}
                <div className="section-tabs">
                    <button
                        className={`section-tab ${activeSection === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveSection('overview')}
                    >
                        Visão Geral
                    </button>
                    <button
                        className={`section-tab ${activeSection === 'weight' ? 'active' : ''}`}
                        onClick={() => setActiveSection('weight')}
                    >
                        Peso
                    </button>
                    <button
                        className={`section-tab ${activeSection === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveSection('settings')}
                    >
                        Configurações
                    </button>
                </div>

                {/* Overview Section */}
                {activeSection === 'overview' && (
                    <div className="section-content">
                        <div className="stats-grid-profile">
                            <div className="stat-card-profile" onClick={() => setShowWeightModal(true)}>
                                <div className="stat-icon-svg-profile">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                                        <circle cx="12" cy="12" r="4" />
                                    </svg>
                                </div>
                                <div className="stat-content-profile">
                                    <span className="stat-label-profile">Peso Atual</span>
                                    <span className="stat-value-profile">
                                        {profile?.current_weight ? `${profile.current_weight} kg` : 'Registrar'}
                                    </span>
                                    {weightChange !== null && (
                                        <span className={`weight-change ${weightChange < 0 ? 'positive' : 'negative'}`}>
                                            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="stat-card-profile">
                                <div className="stat-icon-svg-profile">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                </div>
                                <div className="stat-content-profile">
                                    <span className="stat-label-profile">Meta</span>
                                    <span className="stat-value-profile">
                                        {profile?.weight_goal ? `${profile.weight_goal} kg` : 'Definir'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {profile?.current_weight && profile?.weight_goal && (
                            <div className="progress-card">
                                <div className="progress-header">
                                    <span>Progresso para meta</span>
                                    <span className="progress-percent">{Math.max(0, 100 - progress)}%</span>
                                </div>
                                <div className="progress-bar-profile">
                                    <div className="progress-fill" style={{ width: `${Math.max(0, 100 - progress)}%` }} />
                                </div>
                                <p className="progress-message">
                                    Faltam {(profile.current_weight - profile.weight_goal).toFixed(1)} kg para sua meta!
                                </p>
                            </div>
                        )}

                        <div className="achievements-card">
                            <h3>Conquistas</h3>
                            <div className="achievements-grid">
                                <div className="achievement">
                                    <div className="achievement-icon unlocked"></div>
                                    <span>Primeira Semana</span>
                                </div>
                                <div className="achievement">
                                    <div className="achievement-icon unlocked"></div>
                                    <span>10 Desafios</span>
                                </div>
                                <div className="achievement locked">
                                    <div className="achievement-icon"></div>
                                    <span>Meta Atingida</span>
                                </div>
                                <div className="achievement locked">
                                    <div className="achievement-icon"></div>
                                    <span>30 Dias</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Weight Section */}
                {activeSection === 'weight' && (
                    <div className="section-content">
                        <button className="btn-primary btn-add-weight-main" onClick={() => setShowWeightModal(true)}>
                            + Registrar Peso
                        </button>

                        {logs.length > 0 ? (
                            <div className="weight-history-card">
                                <h3>Histórico de Peso</h3>
                                <div className="weight-list">
                                    {logs.map((log, index) => (
                                        <div key={log.id} className="weight-item">
                                            <div className="weight-item-date">
                                                {new Date(log.logged_at).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: 'short'
                                                })}
                                            </div>
                                            <div className="weight-item-value">{log.weight} kg</div>
                                            {index < logs.length - 1 && (
                                                <div className={`weight-item-diff ${log.weight < logs[index + 1].weight ? 'down' : 'up'}`}>
                                                    {log.weight < logs[index + 1].weight ? '↓' : '↑'}
                                                    {Math.abs(log.weight - logs[index + 1].weight).toFixed(1)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon"></div>
                                <p>Nenhum registro de peso ainda</p>
                                <p className="empty-hint">Registre seu peso para acompanhar sua evolução</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Settings Section */}
                {activeSection === 'settings' && (
                    <div className="section-content">
                        <div className="settings-card">
                            <h3>Informações Pessoais</h3>

                            {editing ? (
                                <div className="edit-form">
                                    <div className="form-group">
                                        <label>Nome</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Seu nome"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Meta de Peso (kg)</label>
                                        <input
                                            type="number"
                                            value={weightGoal}
                                            onChange={e => setWeightGoal(e.target.value)}
                                            placeholder="Ex: 65"
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button className="btn-cancel" onClick={() => setEditing(false)}>Cancelar</button>
                                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                                            {saving ? 'Salvando...' : 'Salvar'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="settings-info">
                                    <div className="info-row">
                                        <span>Nome</span>
                                        <span>{profile?.name || '--'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Email</span>
                                        <span>{profile?.email || '--'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Meta de peso</span>
                                        <span>{profile?.weight_goal ? `${profile.weight_goal} kg` : '--'}</span>
                                    </div>
                                    <button className="btn-edit-settings" onClick={() => setEditing(true)}>
                                        Editar Informações
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="settings-card">
                            <h3>Notificações</h3>
                            <div className="toggle-row">
                                <span>Lembretes diários</span>
                                <div className="toggle active"></div>
                            </div>
                            <div className="toggle-row">
                                <span>Novos desafios</span>
                                <div className="toggle active"></div>
                            </div>
                            <div className="toggle-row">
                                <span>Mensagens da comunidade</span>
                                <div className="toggle"></div>
                            </div>
                        </div>

                        <button className="btn-signout" onClick={signOut}>
                            Sair da conta
                        </button>
                    </div>
                )}
            </div>

            {/* Weight Modal */}
            {showWeightModal && (
                <div className="modal-overlay" onClick={() => setShowWeightModal(false)}>
                    <div className="weight-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowWeightModal(false)}>×</button>
                        <h3>⚖️ Registrar Peso</h3>
                        <div className="form-group">
                            <label>Peso (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={newWeight}
                                onChange={e => setNewWeight(e.target.value)}
                                placeholder="Ex: 72.5"
                                autoFocus
                            />
                        </div>
                        <button
                            className="btn-primary"
                            onClick={handleAddWeight}
                            disabled={!newWeight || addingWeight}
                            style={{ width: '100%' }}
                        >
                            {addingWeight ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
