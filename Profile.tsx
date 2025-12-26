import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWeightLogs } from '../hooks/useWeightLogs'
import './Profile.css'

export default function Profile() {
    const { profile, signOut, updateProfile } = useAuth()
    const { logs, addLog, getWeightChange } = useWeightLogs()
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(profile?.name || '')
    const [weightGoal, setWeightGoal] = useState(profile?.weight_goal?.toString() || '')
    const [currentWeight, setCurrentWeight] = useState(profile?.current_weight?.toString() || '')
    const [saving, setSaving] = useState(false)

    // Modal de registro de peso
    const [showWeightModal, setShowWeightModal] = useState(false)
    const [newWeight, setNewWeight] = useState('')
    const [weightNotes, setWeightNotes] = useState('')
    const [addingWeight, setAddingWeight] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        await updateProfile({
            name,
            weight_goal: weightGoal ? parseFloat(weightGoal) : undefined,
            current_weight: currentWeight ? parseFloat(currentWeight) : undefined
        })
        setSaving(false)
        setEditing(false)
    }

    const handleAddWeight = async () => {
        if (!newWeight) return
        setAddingWeight(true)
        await addLog(parseFloat(newWeight), weightNotes || undefined)
        setNewWeight('')
        setWeightNotes('')
        setShowWeightModal(false)
        setAddingWeight(false)
    }

    const weightChange = getWeightChange()
    const progress = profile?.weight_goal && profile?.current_weight
        ? Math.max(0, Math.min(100, Math.round(((profile.current_weight - profile.weight_goal) / profile.weight_goal) * 100)))
        : 0

    return (
        <section className="profile-page">
            <div className="profile-header">
                <div className="profile-avatar">
                    {profile?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <h1>{profile?.name || 'Usuário'}</h1>
                <p className="profile-email">{profile?.email}</p>

                <div className="profile-badges">
                    <span className="badge">🔥 {profile?.streak_days || 0} dias seguidos</span>
                    <span className="badge">⭐ {profile?.points || 0} pontos</span>
                </div>
            </div>

            <div className="profile-stats">
                <div className="stat-card" onClick={() => setShowWeightModal(true)} style={{ cursor: 'pointer' }}>
                    <span className="stat-icon">⚖️</span>
                    <div className="stat-info">
                        <span className="stat-label">Peso Atual</span>
                        <span className="stat-value">{profile?.current_weight ? `${profile.current_weight} kg` : 'Registrar'}</span>
                        {weightChange !== null && (
                            <span className={`weight-change ${weightChange < 0 ? 'positive' : 'negative'}`}>
                                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                            </span>
                        )}
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">🎯</span>
                    <div className="stat-info">
                        <span className="stat-label">Meta</span>
                        <span className="stat-value">{profile?.weight_goal ? `${profile.weight_goal} kg` : '--'}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">📈</span>
                    <div className="stat-info">
                        <span className="stat-label">Progresso</span>
                        <span className="stat-value">{progress > 0 ? `${100 - progress}%` : '--'}</span>
                    </div>
                </div>
            </div>

            {/* Histórico de peso */}
            {logs.length > 0 && (
                <div className="profile-section-card">
                    <div className="section-header">
                        <h2>📊 Histórico de Peso</h2>
                    </div>
                    <div className="weight-history">
                        {logs.slice(0, 5).map((log, index) => (
                            <div key={log.id} className="weight-entry">
                                <div className="weight-date">
                                    {new Date(log.logged_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                </div>
                                <div className="weight-value">{log.weight} kg</div>
                                {index < logs.length - 1 && (
                                    <div className={`weight-diff ${log.weight < logs[index + 1].weight ? 'down' : 'up'}`}>
                                        {log.weight < logs[index + 1].weight ? '↓' : '↑'}
                                        {Math.abs(log.weight - logs[index + 1].weight).toFixed(1)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <button className="btn-add-weight" onClick={() => setShowWeightModal(true)}>
                        + Registrar Peso
                    </button>
                </div>
            )}

            <div className="profile-section-card">
                <div className="section-header">
                    <h2>Informações Pessoais</h2>
                    {!editing && (
                        <button className="btn-edit" onClick={() => setEditing(true)}>Editar</button>
                    )}
                </div>

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
                        <div className="form-row">
                            <div className="form-group">
                                <label>Peso Atual (kg)</label>
                                <input
                                    type="number"
                                    value={currentWeight}
                                    onChange={e => setCurrentWeight(e.target.value)}
                                    placeholder="Ex: 75"
                                />
                            </div>
                            <div className="form-group">
                                <label>Meta (kg)</label>
                                <input
                                    type="number"
                                    value={weightGoal}
                                    onChange={e => setWeightGoal(e.target.value)}
                                    placeholder="Ex: 65"
                                />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button className="btn-cancel" onClick={() => setEditing(false)}>Cancelar</button>
                            <button className="btn-primary btn-save" onClick={handleSave} disabled={saving}>
                                {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="profile-info">
                        <div className="info-row">
                            <span className="info-label">Nome</span>
                            <span className="info-value">{profile?.name || '--'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Email</span>
                            <span className="info-value">{profile?.email || '--'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Membro desde</span>
                            <span className="info-value">
                                {profile?.created_at
                                    ? new Date(profile.created_at).toLocaleDateString('pt-BR')
                                    : '--'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <button className="btn-signout" onClick={signOut}>
                Sair da conta
            </button>

            {/* Modal de registro de peso */}
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
                        <div className="form-group">
                            <label>Observações (opcional)</label>
                            <textarea
                                value={weightNotes}
                                onChange={e => setWeightNotes(e.target.value)}
                                placeholder="Como está se sentindo?"
                                rows={2}
                            />
                        </div>
                        <button
                            className="btn-primary"
                            onClick={handleAddWeight}
                            disabled={!newWeight || addingWeight}
                            style={{ width: '100%' }}
                        >
                            {addingWeight ? 'Salvando...' : 'Salvar Registro'}
                        </button>
                    </div>
                </div>
            )}
        </section>
    )
}
