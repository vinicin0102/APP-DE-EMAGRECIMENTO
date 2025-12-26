import { useState } from 'react'
import './Lessons.css'

interface Lesson {
    id: string
    title: string
    description: string
    duration: string
    thumbnail: string
    category: string
    completed: boolean
    locked: boolean
}

const lessons: Lesson[] = [
    {
        id: '1',
        title: 'Introdução ao Emagrecimento Saudável',
        description: 'Aprenda os fundamentos para uma perda de peso sustentável',
        duration: '15 min',
        thumbnail: '🎯',
        category: 'Fundamentos',
        completed: true,
        locked: false
    },
    {
        id: '2',
        title: 'Entendendo o Déficit Calórico',
        description: 'Como funciona a matemática da perda de peso',
        duration: '20 min',
        thumbnail: '📊',
        category: 'Fundamentos',
        completed: true,
        locked: false
    },
    {
        id: '3',
        title: 'Montando seu Prato Saudável',
        description: 'Aprenda a equilibrar macronutrientes nas refeições',
        duration: '25 min',
        thumbnail: '🍽️',
        category: 'Nutrição',
        completed: false,
        locked: false
    },
    {
        id: '4',
        title: 'Jejum Intermitente: Guia Completo',
        description: 'Tudo sobre os diferentes protocolos de jejum',
        duration: '30 min',
        thumbnail: '⏰',
        category: 'Nutrição',
        completed: false,
        locked: false
    },
    {
        id: '5',
        title: 'Exercícios para Iniciantes',
        description: 'Treinos simples para começar sua jornada fitness',
        duration: '35 min',
        thumbnail: '💪',
        category: 'Exercícios',
        completed: false,
        locked: true
    },
    {
        id: '6',
        title: 'Controle Emocional e Alimentação',
        description: 'Como lidar com a fome emocional',
        duration: '20 min',
        thumbnail: '🧠',
        category: 'Mindset',
        completed: false,
        locked: true
    },
]

const categories = ['Todos', 'Fundamentos', 'Nutrição', 'Exercícios', 'Mindset']

export default function Lessons() {
    const [activeCategory, setActiveCategory] = useState('Todos')
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

    const filteredLessons = activeCategory === 'Todos'
        ? lessons
        : lessons.filter(l => l.category === activeCategory)

    const completedCount = lessons.filter(l => l.completed).length
    const progress = (completedCount / lessons.length) * 100

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
                        <div className="video-placeholder">
                            <span>{selectedLesson.thumbnail}</span>
                            <button className="play-btn">▶️</button>
                        </div>
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
