import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useChallenges } from '../hooks/useChallenges'
import './ChallengesPage.css'

const staticChallenges = [
    {
        id: '1',
        title: 'Desafio 30 Dias Sem Açúcar',
        description: 'Elimine o açúcar refinado da sua alimentação por 30 dias.',
        participants_count: 2340,
        duration_days: 30,
        difficulty: 'Intermediário' as const,
        reward_points: 500,
        color: '#FF4081',
        emoji: '🍬',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: ''
    },
    {
        id: '2',
        title: '10.000 Passos Diários',
        description: 'Caminhe pelo menos 10.000 passos todos os dias.',
        participants_count: 5120,
        duration_days: 21,
        difficulty: 'Fácil' as const,
        reward_points: 300,
        color: '#00C853',
        emoji: '👟',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: ''
    },
    {
        id: '3',
        title: 'Jejum Intermitente 16:8',
        description: 'Pratique o jejum intermitente de 16 horas por dia.',
        participants_count: 1890,
        duration_days: 14,
        difficulty: 'Avançado' as const,
        reward_points: 400,
        color: '#7C4DFF',
        emoji: '⏰',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: ''
    },
    {
        id: '4',
        title: 'Hidratação Total',
        description: 'Beba pelo menos 2 litros de água por dia.',
        participants_count: 8750,
        duration_days: 7,
        difficulty: 'Fácil' as const,
        reward_points: 150,
        color: '#2979FF',
        emoji: '💧',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: ''
    },
]

export default function ChallengesPage() {
    const { user } = useAuth()
    const { challenges, loading, joinChallenge, isParticipating, getProgress, updateProgress } = useChallenges()
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all')

    const displayChallenges = challenges.length > 0 ? challenges : staticChallenges

    const handleJoin = async (challengeId: string) => {
        if (!user) return
        await joinChallenge(challengeId)
    }

    const handleUpdateProgress = async (challengeId: string) => {
        const currentProgress = getProgress(challengeId)
        const newProgress = Math.min(100, currentProgress + 10)
        await updateProgress(challengeId, newProgress)
    }

    return (
        <div className="challenges-page">
            <header className="page-header">
                <h1>Desafios</h1>
            </header>

            <div className="page-container">
                {/* Stats Cards */}
                <div className="challenge-stats">
                    <div className="challenge-stat-card">
                        <span className="stat-icon">🏆</span>
                        <div className="stat-info">
                            <span className="stat-value">3</span>
                            <span className="stat-label">Ativos</span>
                        </div>
                    </div>
                    <div className="challenge-stat-card">
                        <span className="stat-icon">✅</span>
                        <div className="stat-info">
                            <span className="stat-value">12</span>
                            <span className="stat-label">Concluídos</span>
                        </div>
                    </div>
                    <div className="challenge-stat-card">
                        <span className="stat-icon">⭐</span>
                        <div className="stat-info">
                            <span className="stat-value">2.4k</span>
                            <span className="stat-label">Pontos</span>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('all')}
                    >
                        Todos
                    </button>
                    <button
                        className={`filter-tab ${activeFilter === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('active')}
                    >
                        Participando
                    </button>
                    <button
                        className={`filter-tab ${activeFilter === 'completed' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('completed')}
                    >
                        Concluídos
                    </button>
                </div>

                {/* Challenges List */}
                {loading ? (
                    <div className="loading-challenges">
                        <span>🔄</span>
                        <p>Carregando desafios...</p>
                    </div>
                ) : (
                    <div className="challenges-list">
                        {displayChallenges.map(challenge => {
                            const participating = isParticipating(challenge.id)
                            const progress = getProgress(challenge.id)

                            if (activeFilter === 'active' && !participating) return null
                            if (activeFilter === 'completed' && progress < 100) return null

                            return (
                                <div key={challenge.id} className="challenge-card-full">
                                    <div className="challenge-header-full">
                                        <div
                                            className="challenge-emoji-big"
                                            style={{ background: `${challenge.color}20` }}
                                        >
                                            {challenge.emoji}
                                        </div>
                                        <div className="challenge-info-full">
                                            <div className="challenge-badges">
                                                <span
                                                    className="difficulty-badge"
                                                    style={{ background: `${challenge.color}20`, color: challenge.color }}
                                                >
                                                    {challenge.difficulty}
                                                </span>
                                                <span className="duration-badge">{challenge.duration_days} dias</span>
                                            </div>
                                            <h3>{challenge.title}</h3>
                                            <p>{challenge.description}</p>
                                        </div>
                                    </div>

                                    <div className="challenge-stats-row">
                                        <div className="stat-item">
                                            <span>👥</span>
                                            <span>{challenge.participants_count.toLocaleString()}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span>🏆</span>
                                            <span>{challenge.reward_points} pts</span>
                                        </div>
                                        <div className="stat-item">
                                            <span>📅</span>
                                            <span>{challenge.duration_days}d restantes</span>
                                        </div>
                                    </div>

                                    {participating && (
                                        <div className="progress-section">
                                            <div className="progress-header">
                                                <span>Seu progresso</span>
                                                <span style={{ color: challenge.color }}>{progress}%</span>
                                            </div>
                                            <div className="progress-bar-full">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${progress}%`, background: challenge.color }}
                                                />
                                            </div>
                                            <button
                                                className="btn-update-progress"
                                                onClick={() => handleUpdateProgress(challenge.id)}
                                                disabled={progress >= 100}
                                            >
                                                {progress >= 100 ? '✓ Concluído!' : '+ Registrar Progresso'}
                                            </button>
                                        </div>
                                    )}

                                    {!participating && (
                                        <button
                                            className="btn-join-challenge"
                                            style={{ background: challenge.color }}
                                            onClick={() => handleJoin(challenge.id)}
                                        >
                                            Participar do Desafio
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
