import { useStats } from '../hooks/useStats'
import './Stats.css'

export default function Stats() {
    const { stats } = useStats()

    const statsData = [
        { icon: '👥', value: `${(stats.totalUsers / 1000).toFixed(0)}K+`, label: 'Membros Ativos', color: '#00C853' },
        { icon: '🏆', value: `${stats.totalChallenges}+`, label: 'Desafios Concluídos', color: '#FF4081' },
        { icon: '💪', value: `${(stats.totalWeightLost / 1000).toFixed(0)}K kg`, label: 'Peso Perdido', color: '#7C4DFF' },
        { icon: '⭐', value: stats.averageRating.toFixed(1), label: 'Avaliação Média', color: '#FF6D00' },
    ]

    return (
        <section className="stats-section">
            <div className="stats-grid">
                {statsData.map((stat, index) => (
                    <div key={index} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div className="stat-content">
                            <span className="stat-value" style={{ color: stat.color }}>{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
