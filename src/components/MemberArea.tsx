import { useState, useEffect, useRef } from 'react'
import './MemberArea.css'

// Interfaces
interface Lesson {
    id: string
    title: string
    description: string
    duration: string
    thumbnail: string
    videoUrl?: string
    order: number
    completed?: boolean
    locked?: boolean
}

interface Module {
    id: string
    title: string
    description: string
    thumbnail: string
    color: string
    lessons: Lesson[]
    order: number
}

// Dados padrão dos módulos
const defaultModules: Module[] = [
    {
        id: '1',
        title: 'Fundamentos do Emagrecimento',
        description: 'Aprenda os conceitos básicos para uma jornada de sucesso',
        thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
        color: '#00C853',
        order: 1,
        lessons: [
            { id: '1-1', title: 'Bem-vindo à sua Transformação', description: 'Introdução completa ao programa', duration: '12 min', thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80', order: 1, completed: true, locked: false },
            { id: '1-2', title: 'Entendendo seu Metabolismo', description: 'Como seu corpo queima calorias', duration: '18 min', thumbnail: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&q=80', order: 2, completed: true, locked: false },
            { id: '1-3', title: 'O Poder do Déficit Calórico', description: 'A matemática por trás da perda de peso', duration: '15 min', thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80', order: 3, completed: false, locked: false },
            { id: '1-4', title: 'Definindo suas Metas', description: 'Como criar objetivos alcançáveis', duration: '10 min', thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&q=80', order: 4, completed: false, locked: false },
        ]
    },
    {
        id: '2',
        title: 'Nutrição Inteligente',
        description: 'Domine a alimentação saudável sem dietas restritivas',
        thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
        color: '#FF6D00',
        order: 2,
        lessons: [
            { id: '2-1', title: 'Montando seu Prato Perfeito', description: 'Equilibrando macronutrientes', duration: '20 min', thumbnail: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80', order: 1, completed: false, locked: false },
            { id: '2-2', title: 'Alimentos Termogênicos', description: 'Comidas que aceleram o metabolismo', duration: '14 min', thumbnail: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80', order: 2, completed: false, locked: false },
            { id: '2-3', title: 'Jejum Intermitente Descomplicado', description: 'Guia completo de protocolos', duration: '25 min', thumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80', order: 3, completed: false, locked: true },
            { id: '2-4', title: 'Suplementação Essencial', description: 'O que realmente funciona', duration: '18 min', thumbnail: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80', order: 4, completed: false, locked: true },
        ]
    },
    {
        id: '3',
        title: 'Treinamento Funcional',
        description: 'Exercícios eficientes para resultados rápidos',
        thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
        color: '#7C4DFF',
        order: 3,
        lessons: [
            { id: '3-1', title: 'Treino para Iniciantes', description: 'Comece do zero com segurança', duration: '30 min', thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80', order: 1, completed: false, locked: true },
            { id: '3-2', title: 'Cardio HIIT Queima-Gordura', description: 'Máxima queima em menos tempo', duration: '25 min', thumbnail: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400&q=80', order: 2, completed: false, locked: true },
            { id: '3-3', title: 'Treino Core e Abdômen', description: 'Fortalecimento do centro do corpo', duration: '20 min', thumbnail: 'https://images.unsplash.com/photo-1571019613531-fbeaeb5b5362?w=400&q=80', order: 3, completed: false, locked: true },
        ]
    },
    {
        id: '4',
        title: 'Mindset de Sucesso',
        description: 'A mentalidade que transforma resultados',
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
        color: '#FF4081',
        order: 4,
        lessons: [
            { id: '4-1', title: 'Controlando a Fome Emocional', description: 'Pare de comer por ansiedade', duration: '16 min', thumbnail: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&q=80', order: 1, completed: false, locked: true },
            { id: '4-2', title: 'Criando Hábitos Duradouros', description: 'A ciência por trás da mudança', duration: '22 min', thumbnail: 'https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=400&q=80', order: 2, completed: false, locked: true },
            { id: '4-3', title: 'Superando Platôs', description: 'O que fazer quando o peso estagna', duration: '18 min', thumbnail: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=80', order: 3, completed: false, locked: true },
        ]
    },
]

export default function MemberArea() {
    const [modules, setModules] = useState<Module[]>(defaultModules)
    const [selectedModule, setSelectedModule] = useState<Module | null>(null)
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
    const [continueWatching, setContinueWatching] = useState<Lesson[]>([])
    const [isLoaded, setIsLoaded] = useState(false)
    const carouselRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

    // Carregar módulos do localStorage (salvos pelo admin)
    useEffect(() => {
        const savedModules = localStorage.getItem('adminModules')
        if (savedModules) {
            setModules(JSON.parse(savedModules))
        }

        // Simular "continue assistindo" com aulas em progresso
        const inProgress = defaultModules.flatMap(m =>
            m.lessons.filter(l => l.completed === false && !l.locked).slice(0, 1)
        ).slice(0, 5)
        setContinueWatching(inProgress)

        // Animação de entrada
        setTimeout(() => setIsLoaded(true), 100)
    }, [])

    // Calcular progresso geral
    const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0)
    const completedLessons = modules.reduce((acc, m) =>
        acc + m.lessons.filter(l => l.completed).length, 0
    )
    const overallProgress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0

    // Função para renderizar embed de vídeo
    const renderVideoEmbed = (embedCode: string) => {
        if (embedCode.includes('<iframe') || embedCode.includes('<video')) {
            return <div className="video-embed-netflix" dangerouslySetInnerHTML={{ __html: embedCode }} />
        }
        if (embedCode.includes('youtube.com/watch')) {
            const videoId = embedCode.split('v=')[1]?.split('&')[0]
            return (
                <div className="video-embed-netflix">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Video"
                    />
                </div>
            )
        }
        if (embedCode.includes('vimeo.com')) {
            const videoId = embedCode.split('/').pop()
            return (
                <div className="video-embed-netflix">
                    <iframe
                        src={`https://player.vimeo.com/video/${videoId}?autoplay=1`}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title="Video"
                    />
                </div>
            )
        }
        if (embedCode.startsWith('http')) {
            return (
                <div className="video-embed-netflix">
                    <video controls autoPlay>
                        <source src={embedCode} />
                    </video>
                </div>
            )
        }
        return null
    }

    // Scroll do carrossel
    const scrollCarousel = (id: string, direction: 'left' | 'right') => {
        const carousel = carouselRefs.current[id]
        if (carousel) {
            const scrollAmount = carousel.offsetWidth * 0.8
            carousel.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    return (
        <div className={`member-area-premium ${isLoaded ? 'loaded' : ''}`}>
            {/* Partículas de fundo */}
            <div className="particles-bg">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="particle" style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${15 + Math.random() * 10}s`
                    }} />
                ))}
            </div>

            {/* Header Premium Glassmorphism */}
            <header className="member-header-premium">
                <div className="header-glow"></div>
                <div className="member-header-content-premium">
                    <div className="member-brand-premium">
                        <div className="brand-logo-premium">
                            <div className="logo-container">
                                <div className="logo-ring"></div>
                                <div className="logo-ring delay-1"></div>
                                <div className="logo-ring delay-2"></div>
                                <span className="brand-icon-premium">💎</span>
                            </div>
                            <div className="brand-text-container">
                                <span className="brand-text-premium">ÁREA VIP</span>
                                <span className="member-badge-premium">PREMIUM</span>
                            </div>
                        </div>
                    </div>
                    <div className="member-stats-header">
                        <div className="stat-box">
                            <span className="stat-number">{completedLessons}</span>
                            <span className="stat-label">Concluídas</span>
                        </div>
                        <div className="progress-ring-container">
                            <svg className="progress-ring" viewBox="0 0 100 100">
                                <defs>
                                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#00C853" />
                                        <stop offset="50%" stopColor="#00E676" />
                                        <stop offset="100%" stopColor="#69F0AE" />
                                    </linearGradient>
                                </defs>
                                <circle className="progress-ring-bg" cx="50" cy="50" r="42" />
                                <circle
                                    className="progress-ring-fill"
                                    cx="50" cy="50" r="42"
                                    strokeDasharray={`${overallProgress * 2.64} 264`}
                                />
                            </svg>
                            <span className="progress-ring-text">{overallProgress}%</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="member-content-premium">
                {/* Hero Banner Estático */}
                <section className="hero-banner-static">
                    <div className="banner-image-static">
                        <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80" alt="SlimFit" />
                        <div className="banner-overlay-static"></div>
                    </div>

                    <div className="hero-content-static">
                        <div className="hero-badges-static">
                            <span className="badge-exclusive">💎 EXCLUSIVO</span>
                            <span className="badge-rating">⭐ 4.9</span>
                        </div>

                        <h1 className="hero-title-static">
                            Sua Jornada de<br />
                            <span className="title-highlight">Transformação</span>
                        </h1>

                        <p className="hero-description-static">
                            Acesse {totalLessons} aulas exclusivas em {modules.length} módulos
                        </p>

                        <div className="hero-buttons-static">
                            <button className="btn-start-static" onClick={() => {
                                const firstIncomplete = modules[0]?.lessons.find(l => !l.completed && !l.locked)
                                if (firstIncomplete) setSelectedLesson(firstIncomplete)
                            }}>
                                ▶ Começar Agora
                            </button>
                        </div>
                    </div>
                </section>

                {/* Continue Assistindo */}
                {continueWatching.length > 0 && (
                    <section className="content-row-premium animate-in">
                        <div className="row-header-premium">
                            <div className="row-title-container">
                                <span className="row-icon">🕐</span>
                                <h2>Continue Assistindo</h2>
                            </div>
                            <div className="carousel-controls">
                                <button className="carousel-btn" onClick={() => scrollCarousel('continue', 'left')}>
                                    <span>❮</span>
                                </button>
                                <button className="carousel-btn" onClick={() => scrollCarousel('continue', 'right')}>
                                    <span>❯</span>
                                </button>
                            </div>
                        </div>
                        <div className="lessons-carousel-premium" ref={(el) => { carouselRefs.current['continue'] = el }}>
                            {continueWatching.map((lesson, idx) => (
                                <div
                                    key={lesson.id}
                                    className="lesson-card-premium continue-card"
                                    onClick={() => setSelectedLesson(lesson)}
                                    style={{ animationDelay: `${idx * 0.1}s` }}
                                >
                                    <div className="card-thumbnail">
                                        <img src={lesson.thumbnail} alt={lesson.title} />
                                        <div className="card-overlay">
                                            <div className="play-button-premium">
                                                <span>▶</span>
                                            </div>
                                        </div>
                                        <div className="progress-bar-card">
                                            <div className="progress-fill-card" style={{ width: `${30 + Math.random() * 40}%` }}></div>
                                        </div>
                                        <div className="duration-badge">{lesson.duration}</div>
                                    </div>
                                    <div className="card-info">
                                        <h4>{lesson.title}</h4>
                                        <p>{lesson.description}</p>
                                    </div>
                                    <div className="card-hover-effect"></div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Grid de Módulos Premium */}
                <section className="content-row-premium modules-row animate-in">
                    <div className="row-header-premium">
                        <div className="row-title-container">
                            <span className="row-icon">📚</span>
                            <h2>Seus Módulos</h2>
                        </div>
                        <span className="modules-count">{modules.length} módulos disponíveis</span>
                    </div>
                    <div className="modules-grid-premium">
                        {modules.map((module, index) => {
                            const moduleProgress = module.lessons.length
                                ? Math.round((module.lessons.filter(l => l.completed).length / module.lessons.length) * 100)
                                : 0

                            return (
                                <div
                                    key={module.id}
                                    className="module-card-premium"
                                    onClick={() => setSelectedModule(module)}
                                    style={{
                                        '--module-color': module.color,
                                        animationDelay: `${index * 0.15}s`
                                    } as React.CSSProperties}
                                >
                                    <div className="module-thumbnail-premium">
                                        <img src={module.thumbnail} alt={module.title} />
                                        <div className="module-overlay-premium">
                                            <div className="module-number-badge">
                                                <span>MÓDULO</span>
                                                <span className="number">{index + 1}</span>
                                            </div>
                                            <div className="module-play-btn">
                                                <span>▶</span>
                                            </div>
                                        </div>
                                        <div className="module-gradient-border"></div>
                                    </div>
                                    <div className="module-info-premium">
                                        <h3>{module.title}</h3>
                                        <p>{module.description}</p>
                                        <div className="module-footer">
                                            <div className="lessons-info">
                                                <span className="lesson-count">{module.lessons.length} aulas</span>
                                            </div>
                                            <div className="progress-info">
                                                <div className="mini-progress-bar">
                                                    <div className="mini-progress-fill" style={{ width: `${moduleProgress}%`, background: module.color }}></div>
                                                </div>
                                                <span className="progress-percent" style={{ color: module.color }}>{moduleProgress}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="module-glow-effect" style={{ background: `radial-gradient(circle, ${module.color}30 0%, transparent 70%)` }}></div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* Carrosséis por Módulo */}
                {modules.map((module, moduleIdx) => (
                    <section key={module.id} className="content-row-premium animate-in" style={{ animationDelay: `${moduleIdx * 0.2}s` }}>
                        <div className="row-header-premium">
                            <div className="row-title-container">
                                <div className="category-indicator" style={{ background: module.color }}></div>
                                <h2>{module.title}</h2>
                            </div>
                            <div className="row-actions">
                                <button className="see-all-btn-premium" onClick={() => setSelectedModule(module)}>
                                    Ver tudo
                                    <span>→</span>
                                </button>
                                <div className="carousel-controls">
                                    <button className="carousel-btn" onClick={() => scrollCarousel(module.id, 'left')}>
                                        <span>❮</span>
                                    </button>
                                    <button className="carousel-btn" onClick={() => scrollCarousel(module.id, 'right')}>
                                        <span>❯</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="lessons-carousel-premium" ref={(el) => { carouselRefs.current[module.id] = el }}>
                            {module.lessons.map((lesson, idx) => (
                                <div
                                    key={lesson.id}
                                    className={`lesson-card-premium ${lesson.locked ? 'locked' : ''} ${lesson.completed ? 'completed' : ''}`}
                                    onClick={() => !lesson.locked && setSelectedLesson(lesson)}
                                    style={{ animationDelay: `${idx * 0.1}s` }}
                                >
                                    <div className="card-thumbnail">
                                        <img src={lesson.thumbnail} alt={lesson.title} />
                                        <div className="card-overlay">
                                            {lesson.locked ? (
                                                <div className="lock-badge">
                                                    <span>🔒</span>
                                                    <span className="lock-text">Bloqueado</span>
                                                </div>
                                            ) : (
                                                <div className="play-button-premium">
                                                    <span>▶</span>
                                                </div>
                                            )}
                                        </div>
                                        {lesson.completed && (
                                            <div className="completed-badge-premium">
                                                <span>✓</span>
                                            </div>
                                        )}
                                        <div className="duration-badge">{lesson.duration}</div>
                                        <div className="lesson-number-indicator">{idx + 1}</div>
                                    </div>
                                    <div className="card-info">
                                        <h4>{lesson.title}</h4>
                                        <p>{lesson.description}</p>
                                    </div>
                                    <div className="card-hover-effect" style={{ background: `linear-gradient(135deg, ${module.color}20, transparent)` }}></div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                {/* Quick Stats Section */}
                <section className="quick-stats-section animate-in">
                    <div className="stats-grid">
                        <div className="stat-card-premium">
                            <div className="stat-icon-container" style={{ background: 'linear-gradient(135deg, #00C853, #00E676)' }}>
                                <span>🎯</span>
                            </div>
                            <div className="stat-content">
                                <span className="stat-value-premium">{completedLessons}</span>
                                <span className="stat-label-premium">Aulas Concluídas</span>
                            </div>
                        </div>
                        <div className="stat-card-premium">
                            <div className="stat-icon-container" style={{ background: 'linear-gradient(135deg, #FF6D00, #FFAB40)' }}>
                                <span>📊</span>
                            </div>
                            <div className="stat-content">
                                <span className="stat-value-premium">{overallProgress}%</span>
                                <span className="stat-label-premium">Progresso Total</span>
                            </div>
                        </div>
                        <div className="stat-card-premium">
                            <div className="stat-icon-container" style={{ background: 'linear-gradient(135deg, #7C4DFF, #B388FF)' }}>
                                <span>⏱️</span>
                            </div>
                            <div className="stat-content">
                                <span className="stat-value-premium">∞</span>
                                <span className="stat-label-premium">Acesso Ilimitado</span>
                            </div>
                        </div>
                        <div className="stat-card-premium">
                            <div className="stat-icon-container" style={{ background: 'linear-gradient(135deg, #FF4081, #FF80AB)' }}>
                                <span>🏆</span>
                            </div>
                            <div className="stat-content">
                                <span className="stat-value-premium">{modules.filter(m => m.lessons.every(l => l.completed)).length}</span>
                                <span className="stat-label-premium">Módulos Completos</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Modal do Módulo Premium */}
            {selectedModule && !selectedLesson && (
                <div className="modal-overlay-premium" onClick={() => setSelectedModule(null)}>
                    <div className="module-modal-premium" onClick={e => e.stopPropagation()}>
                        <button className="modal-close-premium" onClick={() => setSelectedModule(null)}>
                            <span>×</span>
                        </button>

                        <div className="modal-banner">
                            <img src={selectedModule.thumbnail} alt={selectedModule.title} />
                            <div className="modal-banner-overlay"></div>
                            <div className="modal-banner-content">
                                <span className="modal-tag" style={{ background: selectedModule.color }}>
                                    MÓDULO {modules.findIndex(m => m.id === selectedModule.id) + 1}
                                </span>
                                <h2>{selectedModule.title}</h2>
                                <p>{selectedModule.description}</p>
                                <div className="modal-meta">
                                    <span>{selectedModule.lessons.length} aulas</span>
                                    <span>•</span>
                                    <span>{selectedModule.lessons.filter(l => l.completed).length} concluídas</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-lessons-list">
                            <h3>Conteúdo do Módulo</h3>
                            {selectedModule.lessons.map((lesson, index) => (
                                <div
                                    key={lesson.id}
                                    className={`lesson-list-item ${lesson.locked ? 'locked' : ''} ${lesson.completed ? 'completed' : ''}`}
                                    onClick={() => !lesson.locked && setSelectedLesson(lesson)}
                                >
                                    <div className="list-item-number">
                                        {lesson.completed ? '✓' : lesson.locked ? '🔒' : index + 1}
                                    </div>
                                    <div className="list-item-thumbnail">
                                        <img src={lesson.thumbnail} alt={lesson.title} />
                                        {!lesson.locked && <span className="mini-play">▶</span>}
                                    </div>
                                    <div className="list-item-content">
                                        <h4>{lesson.title}</h4>
                                        <p>{lesson.description}</p>
                                    </div>
                                    <span className="list-item-duration">{lesson.duration}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal do Vídeo Cinematográfico */}
            {selectedLesson && (
                <div className="modal-overlay-premium video-modal" onClick={() => setSelectedLesson(null)}>
                    <div className="video-modal-premium" onClick={e => e.stopPropagation()}>
                        <button className="modal-close-premium" onClick={() => setSelectedLesson(null)}>
                            <span>×</span>
                        </button>

                        <div className="video-player-container">
                            {selectedLesson.videoUrl ? (
                                renderVideoEmbed(selectedLesson.videoUrl)
                            ) : (
                                <div className="video-placeholder-premium">
                                    <img src={selectedLesson.thumbnail} alt={selectedLesson.title} />
                                    <div className="placeholder-content">
                                        <div className="placeholder-icon">🎬</div>
                                        <span>Vídeo em breve</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="video-info-premium">
                            <div className="video-header">
                                <h2>{selectedLesson.title}</h2>
                                {selectedLesson.completed && (
                                    <span className="completed-pill">✓ Concluída</span>
                                )}
                            </div>
                            <p className="video-description-premium">{selectedLesson.description}</p>
                            <div className="video-meta-premium">
                                <span className="meta-badge">⏱️ {selectedLesson.duration}</span>
                            </div>
                            <div className="video-actions-premium">
                                <button className="btn-mark-complete-premium">
                                    {selectedLesson.completed ? '↺ Assistir novamente' : '✓ Marcar como concluída'}
                                </button>
                                <button className="btn-next-premium">
                                    Próxima aula →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
