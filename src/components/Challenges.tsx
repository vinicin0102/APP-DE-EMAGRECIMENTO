import { useAuth } from '../contexts/AuthContext'
import { useChallenges } from '../hooks/useChallenges'
import './Challenges.css'

interface ChallengesProps {
    fullPage?: boolean
}

// Dados estáticos para quando não há desafios no banco
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
    },
]

export default function Challenges({ fullPage }: ChallengesProps) {
    const { user } = useAuth()
    const { challenges, loading, joinChallenge, isParticipating, getProgress } = useChallenges()

    // Usar desafios do banco ou dados estáticos
    const displayChallenges = challenges.length > 0 ? challenges : staticChallenges

    const handleJoin = async (challengeId: string) => {
        if (!user) {
            alert('Faça login para participar dos desafios!')
            return
        }
        await joinChallenge(challengeId)
    }

    return (
        <section id="challenges" className={`challenges-section ${fullPage ? 'full-page' : ''}`}>
            <h2>
                Desafios que
                <span className="highlight"> transformam</span>
            </h2>
            <p className="section-subtitle">
                Participe de desafios divertidos e ganhe recompensas enquanto alcança seus objetivos
            </p>

            {loading ? (
                <div className="loading-challenges">
                    <span>🔄</span>
                    <p>Carregando desafios...</p>
                </div>
            ) : (
                <div className="challenges-grid">
                    {displayChallenges.map((challenge, index) => {
                        const participating = isParticipating(challenge.id)
                        const progress = getProgress(challenge.id)

                        return (
                            <div
                                key={challenge.id}
                                className={`challenge-card ${participating ? 'participating' : ''}`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="challenge-header">
                                    <div
                                        className="challenge-emoji"
                                        style={{ background: `${challenge.color}20` }}
                                    >
                                        {challenge.emoji}
                                    </div>
                                    <div className="challenge-meta">
                                        <span className="challenge-duration">{challenge.duration_days} dias</span>
                                        <span
                                            className="challenge-difficulty"
                                            style={{
                                                background: `${challenge.color}20`,
                                                color: challenge.color
                                            }}
                                        >
                                            {challenge.difficulty}
                                        </span>
                                    </div>
                                </div>

                                <h3>{challenge.title}</h3>
                                <p>{challenge.description}</p>

                                <div className="challenge-stats">
                                    <div className="challenge-participants">
                                        <div className="participants-avatars">
                                            {[...Array(3)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="mini-avatar"
                                                    style={{
                                                        background: `hsl(${(i * 60) + 200}, 70%, 50%)`,
                                                        zIndex: 3 - i,
                                                        left: `${i * 16}px`
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <span>{challenge.participants_count.toLocaleString()} participantes</span>
                                    </div>
                                    <div className="challenge-reward">
                                        <span>🏆</span>
                                        <span>{challenge.reward_points} pontos</span>
                                    </div>
                                </div>

                                <div className="challenge-progress">
                                    <div className="progress-header">
                                        <span>{participating ? 'Seu progresso' : 'Progresso geral'}</span>
                                        <span style={{ color: challenge.color }}>
                                            {participating ? `${progress}%` : `${Math.floor(Math.random() * 30) + 50}%`}
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: participating ? `${progress}%` : `${Math.floor(Math.random() * 30) + 50}%`,
                                                background: challenge.color
                                            }}
                                        />
                                    </div>
                                </div>

                                <button
                                    className={`btn-join ${participating ? 'participating' : ''}`}
                                    style={{
                                        background: participating ? 'transparent' : challenge.color,
                                        boxShadow: participating ? 'none' : `0 4px 20px ${challenge.color}40`,
                                        border: participating ? `2px solid ${challenge.color}` : 'none',
                                        color: participating ? challenge.color : 'white'
                                    }}
                                    onClick={() => !participating && handleJoin(challenge.id)}
                                    disabled={participating}
                                >
                                    {participating ? '✓ Participando' : 'Participar Agora'}
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
