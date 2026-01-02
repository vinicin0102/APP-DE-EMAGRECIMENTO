import { useState, useRef, useEffect } from 'react'
import './AIAssistantsButton.css'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
}

type ExpertConfig = {
    name: string
    role: string
    avatar: string
    greeting: string
}

const EXPERTS: Record<string, ExpertConfig> = {
    'Dr Camila': {
        name: 'Dr Camila',
        role: 'Personal Trainer',
        avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&q=80',
        greeting: 'Oi musa! 💪 Sou a Camila, sua personal. Vamos botar esse corpo pra mexer? Me conte seu objetivo ou peça um treino rápido!',
    },
    'Dr Jessica': {
        name: 'Dr Jessica',
        role: 'Nutricionista',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&q=80',
        greeting: 'Olá querida! 🥗 Sou a Jessica. Estou aqui para te ajudar a comer bem sem sofrimento. Tem dúvida sobre algum alimento ou quer uma receita?',
    }
}

const SYSTEM_PROMPTS = {
    'Dr Camila': `Você é a Dr. Camila, uma Personal Trainer especializada em mulheres e mães. 
    Você é extremamente motivadora, usa emojis de força (💪, 🔥, 🏋️‍♀️) e fala de forma enérgica e próxima. 
    Seu objetivo é ajudar com treinos rápidos (HIIT), dicas de musculação e motivação para quem tem pouco tempo.
    Sempre reforce a autoestima e a importância de cuidar do corpo. Dê respostas concisas mas completas.
    Não prescreva dietas detalhadas, de dicas gerais ou sugira falar com a Nutricionista.`,

    'Dr Jessica': `Você é a Dr. Jessica, uma Nutricionista especializada em emagrecimento saudável e reeducação alimentar.
    Você é doce, acolhedora e usa emojis de comida (🥗, 🍎, 🥑). 
    Você é contra dietas restritivas malucas. Você ensina a comer com equilíbrio. 
    Dê dicas de receitas práticas, substituições saudáveis e controle de ansiedade. Dê respostas concisas mas acolhedoras.
    Não prescreva treinos detalhados, sugira falar com a Personal.`
}

async function fetchOpenAIResponse(messages: Message[], expert: string) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY

    console.log('Tentando usar API Key:', apiKey ? `Presente (Inicia com ${apiKey.substring(0, 5)}...)` : 'AUSENTE')

    if (!apiKey) {
        return "Erro: Chave de API não encontrada no .env.local"
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPTS[expert as keyof typeof SYSTEM_PROMPTS] },
                    ...messages.map(m => ({ role: m.role, content: m.content }))
                ],
                temperature: 0.7,
                max_tokens: 400
            })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const errorMessage = errorData?.error?.message || `Status ${response.status}`
            console.error('Erro API OpenAI:', errorMessage)

            if (response.status === 429) return "Erro: Limite de uso excedido (Quota) na OpenAI. Verifique seu saldo/plano."
            if (response.status === 401) return "Erro: Chave de API inválida."

            return `Erro da API (${response.status}): ${errorMessage}`
        }

        const data = await response.json()
        return data.choices?.[0]?.message?.content || "A IA não retornou texto."

    } catch (error: any) {
        console.error('Erro de Conexão OpenAI:', error)
        return `Erro de conexão: ${error.message}`
    }
}

export default function AIAssistantsButton() {
    const [isOpen, setIsOpen] = useState(true)
    const [activeChat, setActiveChat] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    const handleOpenChat = (expertName: string) => {
        setActiveChat(expertName)
        setMessages([{
            id: 'init',
            role: 'assistant',
            content: EXPERTS[expertName].greeting
        }])
        setIsOpen(false)
    }

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !activeChat || isTyping) return

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue
        }

        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setInputValue('')
        setIsTyping(true)

        // Chamada real OpenAI
        const responseContent = await fetchOpenAIResponse(newMessages.filter(m => m.id !== 'init'), activeChat)

        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseContent
        }

        setMessages(prev => [...prev, aiMsg])
        setIsTyping(false)
    }

    if (activeChat) {
        const expert = EXPERTS[activeChat]
        return (
            <div className="chat-modal-overlay">
                <div className="chat-modal">
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <img src={expert.avatar} alt={expert.name} className="chat-expert-avatar" />
                            <div>
                                <span className="chat-expert-name">{expert.name}</span>
                                <span className="chat-expert-role">{expert.role}</span>
                            </div>
                        </div>
                        <button className="chat-close-btn" onClick={() => setActiveChat(null)}>×</button>
                    </div>

                    <div className="chat-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`chat-message ${msg.role}`}>
                                {msg.content.split('\n').map((line, i) => (
                                    <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br />}</span>
                                ))}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="chat-message assistant">
                                <span className="typing-dots">...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <input
                            className="chat-input"
                            placeholder="Digite sua mensagem..."
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                            autoFocus
                            disabled={isTyping}
                        />
                        <button
                            className="chat-send-btn"
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isTyping}
                            style={{ opacity: (!inputValue.trim() || isTyping) ? 0.5 : 1 }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="ai-fab-container">
            {isOpen && (
                <div className="ai-cards-container">
                    <div className="ai-card" onClick={() => handleOpenChat('Dr Camila')}>
                        <img src={EXPERTS['Dr Camila'].avatar} alt="Camila" className="ai-card-avatar" />
                        <div className="ai-card-content">
                            <span className="ai-card-title">Dr Camila</span>
                            <span className="ai-card-subtitle">Vou te ajudar com seu treino</span>
                        </div>
                        <button className="ai-card-close" onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}>×</button>
                    </div>

                    <div className="ai-card" onClick={() => handleOpenChat('Dr Jessica')}>
                        <img src={EXPERTS['Dr Jessica'].avatar} alt="Jessica" className="ai-card-avatar" />
                        <div className="ai-card-content">
                            <span className="ai-card-title">Dr Jessica</span>
                            <span className="ai-card-subtitle">Vou te ajudar com sua alimentacao</span>
                        </div>
                        <button className="ai-card-close" onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}>×</button>
                    </div>
                </div>
            )}

            <button className="ai-fab-main" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? (
                    <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>×</span>
                ) : (
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80" alt="IA" style={{ padding: '2px' }} />
                )}
            </button>
        </div>
    )
}
