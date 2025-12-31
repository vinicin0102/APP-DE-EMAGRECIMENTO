import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useChallenges } from '../hooks/useChallenges'
import './ChallengesPage.css'

interface PremiumChallenge {
    id: string
    title: string
    description: string
    participants_count: number
    duration_days: number
    difficulty: 'Fácil' | 'Intermediário' | 'Avançado'
    reward_points: number
    color: string
    emoji: string
    badge_icon: string
    badge_name: string
    is_premium: boolean
    price: number
    checkout_url?: string
    start_date: string
    end_date: string
}

const premiumChallenges: PremiumChallenge[] = [
    {
        id: 'premium-1',
        title: '🔥 Desafio Transformação 30 Dias',
        description: 'O desafio definitivo! Treino + dieta + mentalidade para transformar seu corpo em 30 dias.',
        participants_count: 1240,
        duration_days: 30,
        difficulty: 'Avançado',
        reward_points: 1000,
        color: '#FF1493',
        emoji: '🔥',
        badge_icon: '👑',
        badge_name: 'Rainha da Transformação',
        is_premium: true,
        price: 47.00,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'premium-2',
        title: '💪 Desafio Mamãe Fitness',
        description: 'Treinos especiais para mães retomarem a forma. Com adaptações para rotina corrida.',
        participants_count: 2890,
        duration_days: 21,
        difficulty: 'Intermediário',
        reward_points: 750,
        color: '#9C27B0',
        emoji: '💪',
        badge_icon: '🦋',
        badge_name: 'Musa Fitness',
        is_premium: true,
        price: 37.00,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'premium-3',
        title: '🧘 Desafio Mente & Corpo',
        description: 'Equilíbrio entre exercícios, meditação e alimentação consciente.',
        participants_count: 1560,
        duration_days: 14,
        difficulty: 'Fácil',
        reward_points: 500,
        color: '#00BCD4',
        emoji: '🧘',
        badge_icon: '✨',
        badge_name: 'Musa Zen',
        is_premium: true,
        price: 27.00,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
]

const freeChallenges: PremiumChallenge[] = [
    {
        id: 'free-1',
        title: 'Hidratação Total',
        description: 'Beba pelo menos 2 litros de água por dia durante 7 dias.',
        participants_count: 8750,
        duration_days: 7,
        difficulty: 'Fácil',
        reward_points: 100,
        color: '#2196F3',
        emoji: '💧',
        badge_icon: '💧',
        badge_name: 'Hidratada',
        is_premium: false,
        price: 0,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'free-2',
        title: '10.000 Passos',
        description: 'Caminhe 10.000 passos todos os dias por uma semana.',
        participants_count: 6320,
        duration_days: 7,
        difficulty: 'Fácil',
        reward_points: 100,
        color: '#4CAF50',
        emoji: '👟',
        badge_icon: '🚶',
        badge_name: 'Caminhante',
        is_premium: false,
        price: 0,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
]

export default function ChallengesPage() {
    const { user, profile } = useAuth()
    const { challenges, loading: challengesLoading, joinChallenge, isParticipating, getProgress, updateProgress } = useChallenges()
    const [activeFilter, setActiveFilter] = useState<'premium' | 'free' | 'active'>('premium')
    const [selectedChallenge, setSelectedChallenge] = useState<PremiumChallenge | null>(null)
    const [showPurchaseModal, setShowPurchaseModal] = useState(false)
    const [forceLoaded, setForceLoaded] = useState(false)
    const [purchasedChallenges, setPurchasedChallenges] = useState<string[]>(() => {
        const saved = localStorage.getItem('purchased_challenges')
        return saved ? JSON.parse(saved) : []
    })
    const [completedChallenges, setCompletedChallenges] = useState<string[]>(() => {
        const saved = localStorage.getItem('completed_challenges')
        return saved ? JSON.parse(saved) : []
    })
    const [userBadges, setUserBadges] = useState<{ icon: string, name: string }[]>(() => {
        const saved = localStorage.getItem('user_badges')
        return saved ? JSON.parse(saved) : []
    })

    // Timeout de segurança - força carregamento após 3 segundos
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (challengesLoading) {
                console.warn('ChallengesPage: Timeout de loading atingido, forçando carregamento')
                setForceLoaded(true)
            }
        }, 3000)
        return () => clearTimeout(timeout)
    }, [challengesLoading])

    const loading = challengesLoading && !forceLoaded

    // Converter desafios do Supabase para o formato PremiumChallenge e usar como fonte
    const allChallenges: PremiumChallenge[] = challenges.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        participants_count: c.participants_count || 0,
        duration_days: c.duration_days,
        difficulty: c.difficulty,
        reward_points: c.reward_points,
        color: c.color || '#00C853',
        emoji: c.emoji || '🎯',
        badge_icon: c.emoji || '🏆', // Usa o emoji como ícone do badge por padrão
        badge_name: `Mestre ${c.title.split(' ')[0]}`, // Gera um nome de badge baseado no título
        is_premium: c.is_premium || false,
        price: c.price || 0,
        checkout_url: c.checkout_url,
        start_date: c.start_date,
        end_date: c.end_date
    }))

    const handlePurchase = (challenge: PremiumChallenge) => {
        setSelectedChallenge(challenge)
        setShowPurchaseModal(true)
    }

    const confirmPurchase = () => {
        if (!selectedChallenge) return

        if (selectedChallenge.checkout_url) {
            // Abre o link de checkout em nova aba
            window.open(selectedChallenge.checkout_url, '_blank')
            // Opcional: já marcar como comprado localmente para teste, 
            // mas idealmente isso viria via webhook/confirmação
        } else {
            // Fallback: Adicionar aos desafios comprados (simulação antiga)
            const updated = [...purchasedChallenges, selectedChallenge.id]
            setPurchasedChallenges(updated)
            localStorage.setItem('purchased_challenges', JSON.stringify(updated))
            alert('✅ Compra realizada com sucesso! (Modo Simulação)')
            setShowPurchaseModal(false)
            setSelectedChallenge(null)
        }
    }

    const handleJoinFree = async (challengeId: string) => {
        // Para desafios gratuitos
        const updated = [...purchasedChallenges, challengeId]
        setPurchasedChallenges(updated)
        localStorage.setItem('purchased_challenges', JSON.stringify(updated))
    }

    const handleComplete = (challenge: PremiumChallenge) => {
        // Marcar como concluído
        const updatedCompleted = [...completedChallenges, challenge.id]
        setCompletedChallenges(updatedCompleted)
        localStorage.setItem('completed_challenges', JSON.stringify(updatedCompleted))

        // Adicionar badge
        const newBadge = { icon: challenge.badge_icon, name: challenge.badge_name }
        const updatedBadges = [...userBadges, newBadge]
        setUserBadges(updatedBadges)
        localStorage.setItem('user_badges', JSON.stringify(updatedBadges))
    }

    const isPurchased = (challengeId: string) => purchasedChallenges.includes(challengeId)
    const isCompleted = (challengeId: string) => completedChallenges.includes(challengeId)

    const filteredChallenges = allChallenges.filter(challenge => {
        if (activeFilter === 'premium') return challenge.is_premium
        if (activeFilter === 'free') return !challenge.is_premium
        if (activeFilter === 'active') return isPurchased(challenge.id) && !isCompleted(challenge.id)
        return true
    })

    return (
        <div className="challenges-page">
            <header className="challenges-header">
                <h1>🏆 Desafios</h1>
                <p>Transforme-se e ganhe destaque na comunidade</p>
            </header>

            <div className="page-container">
                {/* User Badges */}
                {userBadges.length > 0 && (
                    <div className="user-badges-section">
                        <h3>🎖️ Suas Conquistas</h3>
                        <div className="badges-row">
                            {userBadges.map((badge, index) => (
                                <div key={index} className="badge-item" title={badge.name}>
                                    <span className="badge-icon">{badge.icon}</span>
                                    <span className="badge-name">{badge.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="challenge-stats">
                    <div className="challenge-stat-card premium-stat">
                        <div className="stat-icon-emoji">🔥</div>
                        <div className="stat-info">
                            <span className="stat-value">{purchasedChallenges.filter(id => premiumChallenges.some(c => c.id === id)).length}</span>
                            <span className="stat-label">Premium</span>
                        </div>
                    </div>
                    <div className="challenge-stat-card">
                        <div className="stat-icon-emoji">✅</div>
                        <div className="stat-info">
                            <span className="stat-value">{completedChallenges.length}</span>
                            <span className="stat-label">Concluídos</span>
                        </div>
                    </div>
                    <div className="challenge-stat-card">
                        <div className="stat-icon-emoji">🏅</div>
                        <div className="stat-info">
                            <span className="stat-value">{userBadges.length}</span>
                            <span className="stat-label">Badges</span>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    <button
                        className={`filter-tab premium-tab ${activeFilter === 'premium' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('premium')}
                    >
                        🔥 Premium
                    </button>
                    <button
                        className={`filter-tab ${activeFilter === 'free' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('free')}
                    >
                        🆓 Gratuitos
                    </button>
                    <button
                        className={`filter-tab ${activeFilter === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('active')}
                    >
                        📍 Meus
                    </button>
                </div>

                {/* Challenges List */}
                <div className="challenges-list">
                    {filteredChallenges.map(challenge => {
                        const purchased = isPurchased(challenge.id)
                        const completed = isCompleted(challenge.id)

                        return (
                            <div
                                key={challenge.id}
                                className={`challenge-card-full ${challenge.is_premium ? 'premium' : ''} ${completed ? 'completed' : ''}`}
                            >
                                {challenge.is_premium && !purchased && (
                                    <div className="premium-badge">
                                        <span>👑 PREMIUM</span>
                                    </div>
                                )}

                                {completed && (
                                    <div className="completed-badge">
                                        <span>✅ CONCLUÍDO</span>
                                    </div>
                                )}

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
                                        <span>{challenge.badge_icon}</span>
                                        <span>{challenge.badge_name}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span>⭐</span>
                                        <span>{challenge.reward_points} pts</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {!purchased && !completed && (
                                    <>
                                        {challenge.is_premium ? (
                                            <button
                                                className="btn-purchase-challenge"
                                                style={{ background: challenge.color }}
                                                onClick={() => handlePurchase(challenge)}
                                            >
                                                <span className="price-tag">R$ {challenge.price.toFixed(2)}</span>
                                                <span>Comprar Desafio</span>
                                            </button>
                                        ) : (
                                            <button
                                                className="btn-join-challenge"
                                                style={{ background: challenge.color }}
                                                onClick={() => handleJoinFree(challenge.id)}
                                            >
                                                Participar Grátis
                                            </button>
                                        )}
                                    </>
                                )}

                                {purchased && !completed && (
                                    <div className="active-challenge-section">
                                        <p className="active-label">✨ Você está participando!</p>
                                        <button
                                            className="btn-complete-challenge"
                                            onClick={() => handleComplete(challenge)}
                                        >
                                            {challenge.badge_icon} Marcar como Concluído
                                        </button>
                                    </div>
                                )}

                                {completed && (
                                    <div className="completed-section">
                                        <span className="completed-icon">{challenge.badge_icon}</span>
                                        <p>Parabéns! Você ganhou o badge "{challenge.badge_name}"!</p>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {filteredChallenges.length === 0 && (
                        <div className="no-challenges">
                            <span>🔍</span>
                            <p>Nenhum desafio encontrado nesta categoria</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Purchase Modal */}
            {showPurchaseModal && selectedChallenge && (
                <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
                    <div className="modal-content purchase-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowPurchaseModal(false)}>×</button>

                        <div className="purchase-header">
                            <span className="purchase-emoji">{selectedChallenge.emoji}</span>
                            <h2>{selectedChallenge.title}</h2>
                        </div>

                        <p className="purchase-desc">{selectedChallenge.description}</p>

                        <div className="purchase-benefits">
                            <h4>O que você ganha:</h4>
                            <ul>
                                <li>✅ Acesso completo ao desafio de {selectedChallenge.duration_days} dias</li>
                                <li>✅ Guia passo a passo exclusivo</li>
                                <li>✅ Badge "{selectedChallenge.badge_name}" ao concluir</li>
                                <li>✅ {selectedChallenge.reward_points} pontos de recompensa</li>
                                <li>✅ Destaque na comunidade</li>
                            </ul>
                        </div>

                        <div className="purchase-price">
                            <span className="price-label">Investimento único:</span>
                            <span className="price-value">R$ {selectedChallenge.price.toFixed(2)}</span>
                        </div>

                        <button className="btn-confirm-purchase" onClick={confirmPurchase}>
                            Comprar Agora 🚀
                        </button>

                        <p className="purchase-note">
                            💳 Pagamento seguro • Acesso imediato
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
