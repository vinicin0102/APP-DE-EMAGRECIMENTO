import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './PlanGenerator.css'

interface GenerationRecord {
    id: string
    user_id: string
    plan_type: 'home_workout' | 'gym_workout' | 'diet'
    generated_at: string
    content: string
}

const planTypes = {
    home_workout: {
        title: 'Treino em Casa',
        description: 'Exercícios práticos para fazer em casa sem equipamentos',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
        ),
        color: '#00C853'
    },
    gym_workout: {
        title: 'Treino na Academia',
        description: 'Plano completo de exercícios para academia com aparelhos',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6.5 6.5h11" />
                <path d="M6.5 17.5h11" />
                <path d="M4 10V6.5a2.5 2.5 0 0 1 5 0v11a2.5 2.5 0 0 0 5 0V6.5a2.5 2.5 0 0 1 5 0V10" />
                <path d="M4 14v3.5a2.5 2.5 0 0 0 5 0v-11a2.5 2.5 0 0 1 5 0v11a2.5 2.5 0 0 0 5 0V14" />
            </svg>
        ),
        color: '#7C4DFF'
    },
    diet: {
        title: 'Dieta Personalizada',
        description: 'Plano alimentar equilibrado para seus objetivos',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
        ),
        color: '#FF4081'
    }
}

// Conteúdos pré-definidos para cada tipo de plano
const planContents = {
    home_workout: `## TREINO EM CASA - PLANO MENSAL

### AQUECIMENTO (5-10 min)
- Polichinelos: 2x30 segundos
- Corrida no lugar: 2x1 minuto
- Rotação de braços: 2x20 cada lado

### SEGUNDA E QUINTA - SUPERIOR
**Circuito 1 (3 rodadas):**
1. Flexões: 12-15 repetições
2. Flexão diamante: 8-10 repetições
3. Superman: 15 repetições
4. Prancha: 45 segundos

**Circuito 2 (3 rodadas):**
1. Flexão com mãos elevadas: 12 repetições
2. Mergulho no sofá: 12 repetições
3. Prancha lateral: 30 seg cada lado

### TERÇA E SEXTA - INFERIOR
**Circuito 1 (3 rodadas):**
1. Agachamento: 20 repetições
2. Afundo alternado: 12 cada perna
3. Elevação de panturrilha: 20 repetições
4. Ponte glúteo: 15 repetições

**Circuito 2 (3 rodadas):**
1. Agachamento sumô: 15 repetições
2. Step no degrau: 12 cada perna
3. Agachamento isométrico: 45 segundos

### QUARTA - CORE E CARDIO
- Mountain climbers: 3x30 segundos
- Bicycle crunch: 3x20 repetições
- Prancha com toque no ombro: 3x16
- Burpees: 3x10 repetições
- Jumping jacks: 3x45 segundos

### DICAS IMPORTANTES
- Descanse 30-60 segundos entre exercícios
- Descanse 2-3 minutos entre circuitos
- Beba bastante água durante o treino
- Mantenha a postura correta sempre`,

    gym_workout: `## TREINO NA ACADEMIA - PLANO MENSAL

### SEGUNDA - PEITO E TRÍCEPS
**Peito:**
1. Supino reto com barra: 4x10-12
2. Supino inclinado halteres: 3x12
3. Crucifixo máquina: 3x12
4. Crossover: 3x15

**Tríceps:**
1. Tríceps corda: 3x12
2. Tríceps francês: 3x12
3. Mergulho máquina: 3x10

### TERÇA - COSTAS E BÍCEPS
**Costas:**
1. Puxada frontal: 4x10-12
2. Remada baixa: 3x12
3. Remada curvada: 3x10
4. Pulldown: 3x12

**Bíceps:**
1. Rosca direta barra: 3x12
2. Rosca alternada: 3x10
3. Rosca martelo: 3x12

### QUARTA - PERNAS
1. Agachamento livre: 4x10-12
2. Leg press 45°: 4x12
3. Cadeira extensora: 3x12
4. Mesa flexora: 3x12
5. Stiff: 3x10
6. Panturrilha em pé: 4x15
7. Panturrilha sentado: 3x15

### QUINTA - OMBROS E ABDÔMEN
**Ombros:**
1. Desenvolvimento máquina: 4x10-12
2. Elevação lateral: 3x12
3. Elevação frontal: 3x12
4. Crucifixo inverso: 3x12

**Abdômen:**
1. Abdominal máquina: 3x20
2. Prancha: 3x45 segundos
3. Abdominal oblíquo: 3x15 cada lado

### SEXTA - FULL BODY LEVE
1. Supino máquina: 3x12
2. Puxada: 3x12
3. Leg press: 3x15
4. Desenvolvimento: 3x12
5. Cardio: 20-30 minutos

### PROGRESSÃO
- Aumente peso quando conseguir fazer todas as séries com facilidade
- Descanse 60-90 segundos entre séries
- Faça aquecimento de 10 min antes de cada treino`,

    diet: `## DIETA PERSONALIZADA - PLANO MENSAL

### CAFÉ DA MANHÃ (7:00h)
**Opção 1:**
- 2 ovos mexidos
- 1 fatia de pão integral
- 1 fruta (banana ou maçã)
- Café ou chá sem açúcar

**Opção 2:**
- 1 bowl de aveia (40g) com leite desnatado
- 1 colher de mel
- Frutas vermelhas

**Opção 3:**
- Vitamina: banana + leite + aveia
- 2 torradas integrais com ricota

### LANCHE DA MANHÃ (10:00h)
- 1 iogurte natural
- 1 punhado de castanhas (30g)
OU
- 1 fruta + 1 fatia de queijo branco

### ALMOÇO (12:30h)
**Proteína (escolha 1):**
- 150g frango grelhado
- 150g peixe assado
- 120g carne magra

**Carboidrato (escolha 1):**
- 4 colheres de arroz integral
- 1 batata doce média
- 100g de macarrão integral

**Vegetais (à vontade):**
- Salada verde variada
- Legumes cozidos ou refogados
- Tempere com azeite e limão

### LANCHE DA TARDE (16:00h)
**Opção 1:**
- Shake de proteína + 1 fruta

**Opção 2:**
- 1 sanduíche natural de frango

**Opção 3:**
- Tapioca com queijo cottage

### JANTAR (19:30h)
**Opção leve:**
- Salada completa com proteína
- Sopa de legumes com frango
- Omelete com vegetais

### CEIA (se necessário - 21:30h)
- 1 xícara de chá de camomila
- 1 iogurte ou queijo cottage

### HIDRATAÇÃO
- Mínimo 2 litros de água por dia
- Evite refrigerantes e sucos industrializados
- Chás são permitidos sem açúcar

### REGRAS IMPORTANTES
1. Não pule refeições
2. Mastigue bem os alimentos
3. Evite frituras e processados
4. Limite o açúcar refinado
5. Prefira preparações grelhadas, assadas ou cozidas`
}

export default function PlanGenerator() {
    const { user } = useAuth()
    const [generations, setGenerations] = useState<GenerationRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState<string | null>(null)
    const [viewingPlan, setViewingPlan] = useState<GenerationRecord | null>(null)

    useEffect(() => {
        if (user) {
            loadGenerations()
        }
    }, [user])

    const loadGenerations = async () => {
        if (!user) return

        try {
            // Buscar gerações do mês atual
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)

            const { data, error } = await supabase
                .from('plan_generations')
                .select('*')
                .eq('user_id', user.id)
                .gte('generated_at', startOfMonth.toISOString())

            if (error) throw error
            setGenerations(data || [])
        } catch (error) {
            console.error('Erro ao carregar gerações:', error)
            // Se a tabela não existir, usar localStorage como fallback
            const saved = localStorage.getItem(`plan_generations_${user.id}`)
            if (saved) {
                const parsed = JSON.parse(saved)
                const startOfMonth = new Date()
                startOfMonth.setDate(1)
                startOfMonth.setHours(0, 0, 0, 0)

                const thisMonth = parsed.filter((g: GenerationRecord) =>
                    new Date(g.generated_at) >= startOfMonth
                )
                setGenerations(thisMonth)
            }
        } finally {
            setLoading(false)
        }
    }

    const canGenerate = (planType: string): boolean => {
        return !generations.some(g => g.plan_type === planType)
    }

    const getExistingPlan = (planType: string): GenerationRecord | undefined => {
        return generations.find(g => g.plan_type === planType)
    }

    const handleGenerate = async (planType: 'home_workout' | 'gym_workout' | 'diet') => {
        if (!user || !canGenerate(planType)) return

        setGenerating(planType)

        try {
            const newGeneration: GenerationRecord = {
                id: crypto.randomUUID(),
                user_id: user.id,
                plan_type: planType,
                generated_at: new Date().toISOString(),
                content: planContents[planType]
            }

            // Tentar salvar no Supabase
            try {
                const { error } = await supabase
                    .from('plan_generations')
                    .insert(newGeneration)

                if (error) throw error
            } catch {
                // Fallback para localStorage
                const saved = localStorage.getItem(`plan_generations_${user.id}`)
                const existing = saved ? JSON.parse(saved) : []
                existing.push(newGeneration)
                localStorage.setItem(`plan_generations_${user.id}`, JSON.stringify(existing))
            }

            setGenerations(prev => [...prev, newGeneration])
            setViewingPlan(newGeneration)
        } catch (error) {
            console.error('Erro ao gerar plano:', error)
        } finally {
            setGenerating(null)
        }
    }

    const getDaysUntilReset = (): number => {
        const now = new Date()
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const diff = nextMonth.getTime() - now.getTime()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    if (loading) {
        return (
            <div className="plan-generator-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Carregando...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="plan-generator-page">
            <header className="page-header">
                <h1>Meus Planos</h1>
            </header>

            <div className="page-container">
                {/* Info Card */}
                <div className="plan-info-card">
                    <div className="info-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                    </div>
                    <div className="info-content">
                        <h3>Geração Mensal</h3>
                        <p>Você pode gerar 1 plano de cada tipo por mês.</p>
                        <p className="reset-info">Próxima renovação em <strong>{getDaysUntilReset()} dias</strong></p>
                    </div>
                </div>

                {/* Plan Cards */}
                <div className="plan-cards-grid">
                    {(Object.entries(planTypes) as [keyof typeof planTypes, typeof planTypes[keyof typeof planTypes]][]).map(([type, info]) => {
                        const existingPlan = getExistingPlan(type)
                        const canGen = canGenerate(type)
                        const isGenerating = generating === type

                        return (
                            <div
                                key={type}
                                className={`plan-card ${existingPlan ? 'generated' : ''}`}
                                style={{ '--plan-color': info.color } as React.CSSProperties}
                            >
                                <div className="plan-card-icon">
                                    {info.icon}
                                </div>
                                <div className="plan-card-content">
                                    <h3>{info.title}</h3>
                                    <p>{info.description}</p>
                                </div>

                                {existingPlan ? (
                                    <div className="plan-card-actions">
                                        <span className="generated-badge">Gerado este mês</span>
                                        <button
                                            className="btn-view-plan"
                                            onClick={() => setViewingPlan(existingPlan)}
                                        >
                                            Ver Plano
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className="btn-generate"
                                        onClick={() => handleGenerate(type)}
                                        disabled={!canGen || isGenerating}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="btn-spinner"></div>
                                                Gerando...
                                            </>
                                        ) : (
                                            'Gerar Plano'
                                        )}
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Generated Plans Summary */}
                <div className="generation-summary">
                    <h3>Resumo do Mês</h3>
                    <div className="summary-items">
                        {(Object.entries(planTypes) as [keyof typeof planTypes, typeof planTypes[keyof typeof planTypes]][]).map(([type, info]) => {
                            const exists = getExistingPlan(type)
                            return (
                                <div key={type} className={`summary-item ${exists ? 'done' : ''}`}>
                                    <div className="summary-icon" style={{ color: info.color }}>
                                        {exists ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22,4 12,14.01 9,11.01" />
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                            </svg>
                                        )}
                                    </div>
                                    <span>{info.title}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Plan Modal */}
            {viewingPlan && (
                <div className="plan-modal-overlay" onClick={() => setViewingPlan(null)}>
                    <div className="plan-modal" onClick={e => e.stopPropagation()}>
                        <div className="plan-modal-header">
                            <h2>{planTypes[viewingPlan.plan_type].title}</h2>
                            <button className="modal-close" onClick={() => setViewingPlan(null)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="plan-modal-body">
                            <div className="plan-content">
                                {viewingPlan.content.split('\n').map((line, i) => {
                                    if (line.startsWith('## ')) {
                                        return <h2 key={i}>{line.replace('## ', '')}</h2>
                                    }
                                    if (line.startsWith('### ')) {
                                        return <h3 key={i}>{line.replace('### ', '')}</h3>
                                    }
                                    if (line.startsWith('**') && line.endsWith('**')) {
                                        return <p key={i} className="bold">{line.replace(/\*\*/g, '')}</p>
                                    }
                                    if (line.startsWith('- ') || line.match(/^\d+\./)) {
                                        return <p key={i} className="list-item">{line}</p>
                                    }
                                    if (line.trim() === '') {
                                        return <br key={i} />
                                    }
                                    return <p key={i}>{line}</p>
                                })}
                            </div>
                        </div>
                        <div className="plan-modal-footer">
                            <p className="generated-date">
                                Gerado em {new Date(viewingPlan.generated_at).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
