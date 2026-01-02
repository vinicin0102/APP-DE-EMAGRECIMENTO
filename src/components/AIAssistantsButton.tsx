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
    keywords: Record<string, string>
    defaultResponse: string
}

const EXPERTS: Record<string, ExpertConfig> = {
    'Dr Camila': {
        name: 'Dr Camila',
        role: 'Personal Trainer',
        avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&q=80',
        greeting: 'Oi musa! 💪 Sou a Camila, sua personal. Vamos botar esse corpo pra mexer? Me conte seu objetivo ou peça um treino rápido!',
        keywords: {
            treino: 'Para hoje, sugiro um HIIT de 20 minutos! 🔥\n30s Polichinelos\n30s Agachamento\n30s Abdominal\nRepita 4x sem descanso!',
            perna: 'Quer pernas torneadas? Agachamento sumô e Afundo são essenciais. Faça 3 séries de 15 repetições bem concentradas!',
            barriga: 'Para secar a barriga, foque na alimentação e faça prancha isométrica. Tente segurar 1 minuto hoje?',
            iniciante: 'Comece devagar! Caminhada acelerada de 30min e exercícios com o peso do corpo são ótimos para começar.'
        },
        defaultResponse: 'Adorei a energia! 🔥 Para te ajudar melhor com seu treino, me diga se você quer focar em pernas, braços, cardio ou se precisa de algo rápido para fazer em casa!'
    },
    'Dr Jessica': {
        name: 'Dr Jessica',
        role: 'Nutricionista',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&q=80',
        greeting: 'Olá querida! 🥗 Sou a Jessica. Estou aqui para te ajudar a comer bem sem sofrimento. Tem dúvida sobre algum alimento ou quer uma receita?',
        keywords: {
            receita: 'Que tal uma panqueca de banana fit? 🍌\n1 banana amassada\n2 ovos\nCanela a gosto\nMisture e frite com um fio de óleo de coco. Delícia!',
            doce: 'Vontade de doce? Tente chocolate 70% cacau ou frutas vermelhas congeladas. Ajuda muito na ansiedade!',
            jantar: 'À noite prefira proteínas leves e saladas. Um omelete com espinafre ou frango grelhado com legumes são ótimos.',
            jejum: 'O jejum 16h é ótimo para desinflamar. Jante às 20h e volte a comer ao meio-dia. Beba muita água nesse período!'
        },
        defaultResponse: 'Entendi! Lembre-se que o equilíbrio é tudo. 🍎 Se quiser dicas específicas sobre café da manhã, almoço, jantar ou lanches fit, é só pedir!'
    }
}

export default function AIAssistantsButton() {
    const [isOpen, setIsOpen] = useState(true) // Começa aberto como na imagem? Ou fechado? Vou deixar true para chamar atenção
    const [activeChat, setActiveChat] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Efeito para rolar chat
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

    const handleSendMessage = () => {
        if (!inputValue.trim() || !activeChat) return

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue
        }

        setMessages(prev => [...prev, userMsg])
        setInputValue('')
        setIsTyping(true)

        // Simular resposta
        setTimeout(() => {
            const expert = EXPERTS[activeChat]
            const lowerInput = userMsg.content.toLowerCase()
            let response = expert.defaultResponse

            // Busca keyword simples
            for (const key in expert.keywords) {
                if (lowerInput.includes(key)) {
                    response = expert.keywords[key]
                    break
                }
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response
            }
            setMessages(prev => [...prev, aiMsg])
            setIsTyping(false)
        }, 1500)
    }

    // Se estiver no chat, renderiza o modal
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
                        />
                        <button className="chat-send-btn" onClick={handleSendMessage}>
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
