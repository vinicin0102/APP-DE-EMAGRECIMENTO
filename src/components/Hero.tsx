import './Hero.css'

interface HeroProps {
    onStartClick?: () => void
}

export default function Hero({ onStartClick }: HeroProps) {
    return (
        <section className="hero">
            <div className="hero-bg-effects">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
            </div>

            <div className="hero-content">
                <div className="hero-badge">
                    <span className="badge-icon">🔥</span>
                    <span>Mais de 10.000 transformações</span>
                </div>

                <h1 className="hero-title">
                    Transforme seu corpo com o poder da
                    <span className="gradient-text"> comunidade</span>
                </h1>

                <p className="hero-subtitle">
                    Junte-se a milhares de pessoas que estão conquistando o corpo dos sonhos
                    através de desafios, apoio mútuo e acompanhamento personalizado.
                </p>

                <div className="hero-cta">
                    <button className="btn-primary hero-btn" onClick={onStartClick}>
                        <span>Começar Jornada</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button className="btn-secondary hero-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polygon points="10 8 16 12 10 16 10 8" />
                        </svg>
                        <span>Ver como funciona</span>
                    </button>
                </div>

                <div className="hero-stats">
                    <div className="hero-stat">
                        <span className="stat-number">10K+</span>
                        <span className="stat-label">Membros ativos</span>
                    </div>
                    <div className="hero-stat-divider"></div>
                    <div className="hero-stat">
                        <span className="stat-number">98%</span>
                        <span className="stat-label">Taxa de sucesso</span>
                    </div>
                    <div className="hero-stat-divider"></div>
                    <div className="hero-stat">
                        <span className="stat-number">500+</span>
                        <span className="stat-label">Desafios concluídos</span>
                    </div>
                </div>
            </div>

            <div className="hero-visual">
                <div className="phone-mockup">
                    <div className="phone-screen">
                        <div className="phone-header">
                            <div className="phone-notch"></div>
                        </div>
                        <div className="phone-content">
                            <div className="phone-card">
                                <div className="phone-user">
                                    <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #FF4081, #FF6EC7)' }}>M</div>
                                    <div className="user-info">
                                        <span className="user-name">Maria Silva</span>
                                        <span className="user-badge">🏆 -15kg em 3 meses</span>
                                    </div>
                                </div>
                                <p className="phone-message">"A comunidade me motivou todos os dias!"</p>
                                <div className="phone-reactions">
                                    <span>❤️ 234</span>
                                    <span>💪 89</span>
                                    <span>🔥 156</span>
                                </div>
                            </div>

                            <div className="phone-card">
                                <div className="phone-user">
                                    <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #2979FF, #82B1FF)' }}>J</div>
                                    <div className="user-info">
                                        <span className="user-name">João Costa</span>
                                        <span className="user-badge">⭐ Membro Premium</span>
                                    </div>
                                </div>
                                <p className="phone-message">"Desafio de 30 dias completo! 💪"</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="floating-cards">
                    <div className="floating-card card-progress">
                        <div className="card-icon">📊</div>
                        <div className="card-info">
                            <span className="card-title">Progresso Semanal</span>
                            <span className="card-value gradient-text">-2.3 kg</span>
                        </div>
                    </div>

                    <div className="floating-card card-streak">
                        <div className="card-icon">🔥</div>
                        <div className="card-info">
                            <span className="card-title">Sequência</span>
                            <span className="card-value">21 dias</span>
                        </div>
                    </div>

                    <div className="floating-card card-goal">
                        <div className="card-icon">🎯</div>
                        <div className="card-info">
                            <span className="card-title">Meta</span>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: '75%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
