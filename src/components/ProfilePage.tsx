import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWeightLogs } from '../hooks/useWeightLogs'
import { supabase } from '../lib/supabase'
import './ProfilePage.css'

export default function ProfilePage() {
    const { profile, signOut, updateProfile } = useAuth()
    const { logs, addLog, getWeightChange } = useWeightLogs()
    const [activeSection, setActiveSection] = useState<'overview' | 'weight' | 'settings'>('overview')

    // Estados de edição
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(profile?.name || '')
    const [weightGoal, setWeightGoal] = useState(profile?.weight_goal?.toString() || '')
    const [height, setHeight] = useState(profile?.height?.toString() || '') // em cm ou m? vamos usar MT (ex: 1.65)
    const [birthDate, setBirthDate] = useState(profile?.birth_date || '')

    const [saving, setSaving] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Modal de peso
    const [showWeightModal, setShowWeightModal] = useState(false)
    const [newWeight, setNewWeight] = useState('')
    const [addingWeight, setAddingWeight] = useState(false)

    // Handler para Salvar Perfil
    const handleSave = async () => {
        setSaving(true)
        try {
            await updateProfile({
                name,
                weight_goal: weightGoal ? parseFloat(weightGoal) : undefined,
                height: height ? parseFloat(height) : undefined,
                birth_date: birthDate || undefined
            })
            setEditing(false)
        } catch (error) {
            console.error('Erro ao salvar perfil:', error)
            alert('Não foi possível salvar as alterações.')
        } finally {
            setSaving(false)
        }
    }

    // Handler para Upload de Avatar
    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploadingAvatar(true)
            if (!event.target.files || event.target.files.length === 0) return

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${profile?.id}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            console.log('Iniciando upload para:', filePath)

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) {
                console.error('Erro detalhado no Storage:', uploadError)
                throw uploadError
            }

            console.log('Upload concluído, obtendo URL pública...')
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            console.log('URL Pública:', publicUrl)
            console.log('Atualizando perfil no banco...')

            await updateProfile({ avatar_url: publicUrl })
            console.log('Perfil atualizado com sucesso!')

        } catch (error: any) {
            console.error('Erro Completo no Upload:', error)
            alert(`Erro ao atualizar foto: ${error.message || error.error_description || 'Erro desconhecido'}`)
        } finally {
            setUploadingAvatar(false)
        }
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

    // Cálculo IMC
    const imc = profile?.current_weight && profile?.height
        ? (profile.current_weight / (profile.height * profile.height)).toFixed(1)
        : null

    const getImcStatus = (imcValue: number) => {
        if (imcValue < 18.5) return 'Abaixo do peso'
        if (imcValue < 24.9) return 'Peso normal'
        if (imcValue < 29.9) return 'Sobrepeso'
        return 'Obesidade'
    }

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
                    <div className="profile-avatar-container" onClick={() => fileInputRef.current?.click()}>
                        {uploadingAvatar ? (
                            <div className="avatar-loading">Wait...</div>
                        ) : profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="profile-avatar-img" />
                        ) : (
                            <div className="profile-avatar-large">
                                {profile?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                        )}
                        <div className="avatar-edit-icon">📷</div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    </div>

                    <h2>{profile?.name || 'Usuário'}</h2>
                    <p className="profile-email-text">{profile?.email}</p>

                    <div className="profile-badges-row">
                        <span className="badge-pill">🔥 {profile?.streak_days || 0} dias</span>
                        <span className="badge-pill">💎 {profile?.points || 0} pts</span>
                    </div>

                    {profile?.height && profile?.birth_date && (
                        <div className="profile-mini-stats">
                            <span>{profile.height}m</span>
                            <span className="separator">•</span>
                            <span>{Math.floor((new Date().getTime() - new Date(profile.birth_date).getTime()) / 31557600000)} anos</span>
                        </div>
                    )}
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
                        Dados
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

                            {imc && (
                                <div className="stat-card-profile">
                                    <div className="stat-icon-svg-profile">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </div>
                                    <div className="stat-content-profile">
                                        <span className="stat-label-profile">IMC</span>
                                        <span className="stat-value-profile">{imc}</span>
                                        <span className="stat-sub">{getImcStatus(parseFloat(imc))}</span>
                                    </div>
                                </div>
                            )}
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

                        {/* Achievements - Placeholder for now */}
                        <div className="achievements-card">
                            <h3>Conquistas</h3>
                            <div className="achievements-grid">
                                <div className="achievement">
                                    <div className="achievement-icon unlocked">🏆</div>
                                    <span>Bem-vinda</span>
                                </div>
                                <div className="achievement">
                                    <div className="achievement-icon unlocked">⚖️</div>
                                    <span>Primeiro Peso</span>
                                </div>
                                <div className="achievement locked">
                                    <div className="achievement-icon">🎯</div>
                                    <span>Meta Atingida</span>
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
                                <div className="empty-icon">⚖️</div>
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
                                    <div className="form-row">
                                        <div className="form-group half">
                                            <label>Altura (metros)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={height}
                                                onChange={e => setHeight(e.target.value)}
                                                placeholder="Ex: 1.65"
                                            />
                                        </div>
                                        <div className="form-group half">
                                            <label>Meta Peso (kg)</label>
                                            <input
                                                type="number"
                                                value={weightGoal}
                                                onChange={e => setWeightGoal(e.target.value)}
                                                placeholder="Ex: 65"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Data de Nascimento</label>
                                        <input
                                            type="date"
                                            value={birthDate}
                                            onChange={e => setBirthDate(e.target.value)}
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
                                        <span>Altura</span>
                                        <span>{profile?.height ? `${profile.height}m` : '--'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Meta de peso</span>
                                        <span>{profile?.weight_goal ? `${profile.weight_goal} kg` : '--'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span>Nascimento</span>
                                        <span>{profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('pt-BR') : '--'}</span>
                                    </div>
                                    <button className="btn-edit-settings" onClick={() => setEditing(true)}>
                                        Editar Informações
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="settings-card">
                            <h3>Conta</h3>
                            <button className="btn-signout" onClick={signOut}>
                                Sair da conta
                            </button>
                        </div>
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
