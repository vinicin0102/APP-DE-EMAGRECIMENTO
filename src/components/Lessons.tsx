import { useState, useEffect } from 'react'
import './Lessons.css'

interface Lesson {
    id: string
    title: string
    description: string
    duration: string
    thumbnail: string
    category: string
    videoUrl?: string
    order: number
    completed?: boolean
    locked?: boolean
}

const defaultLessons: Lesson[] = [
    { id: '1', title: 'Introdução ao Emagrecimento Saudável', description: 'Aprenda os fundamentos para uma perda de peso sustentável', duration: '15 min', thumbnail: '🎯', category: 'Fundamentos', order: 1, completed: true, locked: false },
    { id: '2', title: 'Entendendo o Déficit Calórico', description: 'Como funciona a matemática da perda de peso', duration: '20 min', thumbnail: '📊', category: 'Fundamentos', order: 2, completed: true, locked: false },
    { id: '3', title: 'Montando seu Prato Saudável', description: 'Aprenda a equilibrar macronutrientes nas refeições', duration: '25 min', thumbnail: '🍽️', category: 'Nutrição', order: 3, completed: false, locked: false },
    { id: '4', title: 'Jejum Intermitente: Guia Completo', description: 'Tudo sobre os diferentes protocolos de jejum', duration: '30 min', thumbnail: '⏰', category: 'Nutrição', order: 4, completed: false, locked: false },
    { id: '5', title: 'Exercícios para Iniciantes', description: 'Treinos simples para começar sua jornada fitness', duration: '35 min', thumbnail: '💪', category: 'Exercícios', order: 5, completed: false, locked: true },
    { id: '6', title: 'Controle Emocional e Alimentação', description: 'Como lidar com a fome emocional', duration: '20 min', thumbnail: '🧠', category: 'Mindset', order: 6, completed: false, locked: true },
]

const categories = ['Todos', 'Fundamentos', 'Nutrição', 'Exercícios', 'Mindset']

export default function Lessons() {
    const [lessons, setLessons] = useState<Lesson[]>(defaultLessons)
    const [activeCategory, setActiveCategory] = useState('Todos')
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

    // Carregar aulas do localStorage (salvas pelo admin)
    useEffect(() => {
        const savedLessons = localStorage.getItem('adminLessons')
        if (savedLessons) {
            const parsed = JSON.parse(savedLessons)
            // Merge com dados default (para manter completed/locked)
            const merged = parsed.map((lesson: Lesson) => ({
                ...lesson,
                completed: defaultLessons.find(d => d.id === lesson.id)?.completed || false,
                locked: defaultLessons.find(d => d.id === lesson.id)?.locked || false
            }))
            setLessons(merged.sort((a: Lesson, b: Lesson) => a.order - b.order))
        }
    }, [])

    const filteredLessons = activeCategory === 'Todos'
        ? lessons
        : lessons.filter(l => l.category === activeCategory)

    const completedCount = lessons.filter(l => l.completed).length
    const progress = (completedCount / lessons.length) * 100

    // Função para renderizar embed de vídeo
    const renderVideoEmbed = (embedCode: string) => {
        // Se for código HTML/iframe, renderiza diretamente
        if (embedCode.includes('<iframe') || embedCode.includes('<video')) {
            return <div className="video-embed" dangerouslySetInnerHTML={{ __html: embedCode }} />
        }
        // Se for URL do YouTube, converte para embed
        if (embedCode.includes('youtube.com/watch')) {
            const videoId = embedCode.split('v=')[1]?.split('&')[0]
            return (
                <div className="video-embed">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Video"
                    />
                </div>
            )
        }
        // Se for URL do Vimeo
        if (embedCode.includes('vimeo.com')) {
            const videoId = embedCode.split('/').pop()
            return (
                <div className="video-embed">
                    <iframe
                        src={`https://player.vimeo.com/video/${videoId}`}
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title="Video"
                    />
                </div>
            )
        }
        // URL direta (mp4, etc.)
        if (embedCode.startsWith('http')) {
            return (
                <div className="video-embed">
                    <video controls>
                        <source src={embedCode} />
                    </video>
                </div>
            )
        }
        return null
    }

    return (
        <div className="lessons-page">
            <header className="page-header">
                <h1>Aulas</h1>
            </header>

            <div className="page-container">
                {/* Progress Card */}
                <div className="progress-card">
                    <div className="progress-info">
                        <span className="progress-label">Seu progresso</span>
                        <span className="progress-value">{completedCount}/{lessons.length} aulas</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* Categories */}
                <div className="categories-scroll">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Lessons Grid */}
                <div className="lessons-grid">
                    {filteredLessons.map(lesson => (
                        <div
                            key={lesson.id}
                            className={`lesson-card ${lesson.completed ? 'completed' : ''} ${lesson.locked ? 'locked' : ''}`}
                            onClick={() => !lesson.locked && setSelectedLesson(lesson)}
                        >
                            <div className="lesson-thumbnail">
                                {lesson.thumbnail}
                                {lesson.completed && <span className="completed-badge">✓</span>}
                                {lesson.locked && <span className="locked-badge">🔒</span>}
                            </div>
                            <div className="lesson-info">
                                <span className="lesson-category">{lesson.category}</span>
                                <h3>{lesson.title}</h3>
                                <p>{lesson.description}</p>
                                <span className="lesson-duration">⏱️ {lesson.duration}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Video Modal */}
            {selectedLesson && (
                <div className="lesson-modal" onClick={() => setSelectedLesson(null)}>
                    <div className="lesson-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedLesson(null)}>×</button>

                        {/* Renderizar vídeo embed ou placeholder */}
                        {selectedLesson.videoUrl ? (
                            renderVideoEmbed(selectedLesson.videoUrl)
                        ) : (
                            <div className="video-placeholder">
                                <span>{selectedLesson.thumbnail}</span>
                                <p>Vídeo não disponível</p>
                            </div>
                        )}

                        <div className="lesson-modal-info">
                            <span className="lesson-category">{selectedLesson.category}</span>
                            <h2>{selectedLesson.title}</h2>
                            <p>{selectedLesson.description}</p>
                            <div className="lesson-meta">
                                <span>⏱️ {selectedLesson.duration}</span>
                                {selectedLesson.completed && <span className="completed-tag">✓ Concluída</span>}
                            </div>
                            <button className="btn-primary btn-start-lesson">
                                {selectedLesson.completed ? 'Assistir Novamente' : 'Começar Aula'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
