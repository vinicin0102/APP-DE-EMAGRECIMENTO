import { useState, useRef, useEffect } from 'react'
import './AIAssistant.css'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

const suggestions = [
    'Monte uma dieta personalizada',
    'Sugira um treino para iniciantes',
    'Dicas para controlar a ansiedade',
    'Receitas fit rápidas e fáceis',
    'Como calcular meu IMC?',
    'Dicas de jejum intermitente',
]

export default function AIAssistant() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Olá! Eu sou a Nutri IA, sua assistente pessoal de emagrecimento. Como posso ajudar você hoje?\n\nPosso ajudar com:\n• Dicas de alimentação saudável\n• Sugestões de exercícios\n• Análise do seu progresso\n• Dicas de bem-estar mental\n• Estratégias para atingir suas metas',
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const generateResponse = (userMessage: string): string => {
        const lowerMessage = userMessage.toLowerCase()

        if (lowerMessage.includes('dieta') || lowerMessage.includes('alimentação') || lowerMessage.includes('comer')) {
            return `🍽️ **Dicas de Alimentação Saudável**\n\nPara uma dieta equilibrada, siga estas orientações:\n\n1. **Café da manhã:** Ovos + frutas ou aveia com banana\n2. **Almoço:** Proteína magra + vegetais + carboidrato integral\n3. **Jantar:** Leve, com salada e proteína\n\n**Dicas extras:**\n• Beba 2L de água por dia\n• Evite açúcar refinado\n• Faça 5-6 refeições pequenas\n• Mastigue devagar\n\nQuer que eu detalhe alguma dessas refeições? 🥗`
        }

        if (lowerMessage.includes('treino') || lowerMessage.includes('exercício') || lowerMessage.includes('academia')) {
            return `💪 **Treino para Iniciantes**\n\nAqui está um treino simples para começar:\n\n**Segunda/Quarta/Sexta:**\n• 20 agachamentos\n• 15 flexões (ou apoio no joelho)\n• 30 segundos prancha\n• 20 jumping jacks\n• Repita 3x\n\n**Terça/Quinta:**\n• 30 minutos de caminhada\n• Alongamentos\n\n**Importante:** Comece devagar e aumente a intensidade gradualmente. Descanse no fim de semana!\n\nQuer um treino mais avançado? 🏋️`
        }

        if (lowerMessage.includes('ansiedade') || lowerMessage.includes('estresse') || lowerMessage.includes('emocional')) {
            return `🧘 **Controlando a Ansiedade**\n\nA fome emocional é comum. Veja como lidar:\n\n1. **Respire fundo:** 4s inspirando, 7s segurando, 8s expirando\n2. **Beba água:** Às vezes confundimos sede com fome\n3. **Distraia-se:** Caminhe, ligue para alguém\n4. **Coma conscientemente:** Sem TV, preste atenção no alimento\n\n**Dica extra:** Medite 5 minutos ao acordar. Apps como Headspace ajudam!\n\nPrecisa de mais dicas de bem-estar? 🌟`
        }

        if (lowerMessage.includes('imc') || lowerMessage.includes('peso ideal') || lowerMessage.includes('calcular')) {
            return `📊 **Calculando o IMC**\n\nFórmula: **IMC = Peso ÷ (Altura²)**\n\nExemplo: 70kg ÷ (1,70m)² = 24,22\n\n**Classificação:**\n• < 18,5 = Abaixo do peso\n• 18,5-24,9 = Normal ✅\n• 25-29,9 = Sobrepeso\n• 30-34,9 = Obesidade grau I\n• 35+ = Obesidade grau II ou III\n\n⚠️ O IMC é apenas uma referência. Consulte um profissional para avaliação completa!\n\nQuer que eu calcule o seu? Me diz seu peso e altura! 📏`
        }

        if (lowerMessage.includes('jejum') || lowerMessage.includes('intermitente')) {
            return `⏰ **Jejum Intermitente**\n\nProtocolos mais populares:\n\n**16:8 (mais comum):**\n• Janela alimentar: 8 horas\n• Jejum: 16 horas\n• Ex: Comer das 12h às 20h\n\n**18:6:**\n• Janela alimentar: 6 horas\n• Para intermediários\n\n**Dicas importantes:**\n• Durante o jejum: água, café e chá sem açúcar são permitidos\n• Não exagere na primeira refeição\n• Comece gradualmente (12h → 14h → 16h)\n\n⚠️ Consulte um médico antes de começar!\n\nQuer mais detalhes sobre algum protocolo? 🕐`
        }

        if (lowerMessage.includes('receita') || lowerMessage.includes('receitas')) {
            return `🥗 **Receitas Fit Rápidas**\n\n**1. Bowl de Proteína:**\n200g frango grelhado + arroz integral + brócolis + molho shoyu\n\n**2. Panqueca Fit:**\n1 banana + 2 ovos + canela → Bata e frite\n\n**3. Smoothie Verde:**\nEspinafre + banana + leite vegetal + gelo\n\n**4. Wrap Leve:**\nTortilha integral + frango desfiado + alface + tomate\n\nTodas são rápidas (menos de 15 min) e nutritivas! 🍳\n\nQuer a receita detalhada de alguma? 📝`
        }

        return `Obrigada pela sua pergunta! 🤗\n\nPara te ajudar melhor, posso falar sobre:\n\n• 🍽️ **Alimentação** - Dicas de dieta e nutrição\n• 💪 **Exercícios** - Treinos personalizados\n• ⏰ **Jejum Intermitente** - Protocolos e dicas\n• 🧘 **Bem-estar** - Controle emocional\n• 📊 **IMC e metas** - Cálculos e estratégias\n\nSobre qual tema você gostaria de saber mais?`
    }

    const handleSend = async () => {
        if (!input.trim()) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsTyping(true)

        // Simular delay de resposta
        setTimeout(() => {
            const response = generateResponse(userMessage.content)
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, aiMessage])
            setIsTyping(false)
        }, 1000 + Math.random() * 1000)
    }

    const handleSuggestion = (suggestion: string) => {
        setInput(suggestion)
    }

    return (
        <div className="ai-page">
            <header className="page-header">
                <div className="ai-header">
                    <div className="ai-avatar">🤖</div>
                    <div className="ai-info">
                        <h1>Nutri IA</h1>
                        <span className="ai-status">Online • Pronta para ajudar</span>
                    </div>
                </div>
            </header>

            <div className="chat-container">
                <div className="messages-container">
                    {messages.map(msg => (
                        <div key={msg.id} className={`message ${msg.role}`}>
                            {msg.role === 'assistant' && <div className="message-avatar">🤖</div>}
                            <div className="message-bubble">
                                {msg.content.split('\n').map((line, i) => (
                                    <span key={i}>
                                        {line}
                                        {i < msg.content.split('\n').length - 1 && <br />}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="message assistant">
                            <div className="message-avatar">🤖</div>
                            <div className="message-bubble typing">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Suggestions */}
                {messages.length === 1 && (
                    <div className="suggestions-container">
                        {suggestions.map((suggestion, i) => (
                            <button
                                key={i}
                                className="suggestion-btn"
                                onClick={() => handleSuggestion(suggestion)}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div className="chat-input-container">
                    <input
                        type="text"
                        placeholder="Digite sua mensagem..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        className="send-btn"
                        onClick={handleSend}
                        disabled={!input.trim()}
                    >
                        📤
                    </button>
                </div>
            </div>
        </div>
    )
}
