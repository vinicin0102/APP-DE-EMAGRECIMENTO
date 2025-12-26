import { useState } from 'react'
import './Support.css'

interface FAQ {
    question: string
    answer: string
}

const faqs: FAQ[] = [
    {
        question: 'Como funciona o app?',
        answer: 'O SlimFit é uma comunidade de emagrecimento onde você pode participar de desafios, acompanhar seu progresso, assistir aulas educativas e receber dicas personalizadas da nossa IA.'
    },
    {
        question: 'Os desafios são gratuitos?',
        answer: 'Sim! Todos os desafios básicos são gratuitos. Alguns desafios premium com acompanhamento personalizado podem ter custo adicional.'
    },
    {
        question: 'Como registro meu peso?',
        answer: 'Vá até a aba Perfil, clique no card de "Peso Atual" ou no botão "Registrar Peso" na seção de peso. Você pode registrar seu peso quantas vezes quiser.'
    },
    {
        question: 'Como funciona o sistema de pontos?',
        answer: 'Você ganha pontos ao completar desafios, manter streaks diários, interagir na comunidade e atingir suas metas. Os pontos liberam conquistas e recompensas!'
    },
    {
        question: 'Posso usar offline?',
        answer: 'Algumas funcionalidades básicas funcionam offline, mas para participar de desafios e acessar a comunidade é necessário conexão com internet.'
    },
    {
        question: 'Como cancelar minha conta?',
        answer: 'Vá em Perfil > Configurações e clique em "Sair da conta". Para excluir permanentemente, entre em contato com nosso suporte.'
    },
]

export default function Support() {
    const [openFaq, setOpenFaq] = useState<number | null>(null)
    const [showChat, setShowChat] = useState(false)
    const [message, setMessage] = useState('')
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'support', text: string }[]>([
        { role: 'support', text: 'Olá! 👋 Como posso ajudar você hoje?' }
    ])

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index)
    }

    const handleSendMessage = () => {
        if (!message.trim()) return

        setChatMessages(prev => [...prev, { role: 'user', text: message }])
        setMessage('')

        // Simular resposta do suporte
        setTimeout(() => {
            setChatMessages(prev => [...prev, {
                role: 'support',
                text: 'Obrigado pelo contato! Um de nossos atendentes irá responder em breve. Enquanto isso, confira nossa seção de FAQ que pode ter a resposta que você precisa! 😊'
            }])
        }, 1000)
    }

    return (
        <div className="support-page">
            <header className="page-header">
                <h1>Suporte</h1>
            </header>

            <div className="page-container">
                {/* Quick Actions */}
                <div className="quick-actions">
                    <button className="quick-action" onClick={() => setShowChat(true)}>
                        <span className="action-icon">💬</span>
                        <span>Chat</span>
                    </button>
                    <a href="mailto:suporte@slimfit.app" className="quick-action">
                        <span className="action-icon">📧</span>
                        <span>Email</span>
                    </a>
                    <a href="https://wa.me/5511999999999" className="quick-action">
                        <span className="action-icon">📱</span>
                        <span>WhatsApp</span>
                    </a>
                </div>

                {/* FAQ Section */}
                <div className="faq-section">
                    <h2>❓ Perguntas Frequentes</h2>

                    <div className="faq-list">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className={`faq-item ${openFaq === index ? 'open' : ''}`}
                                onClick={() => toggleFaq(index)}
                            >
                                <div className="faq-question">
                                    <span>{faq.question}</span>
                                    <span className="faq-toggle">{openFaq === index ? '−' : '+'}</span>
                                </div>
                                {openFaq === index && (
                                    <div className="faq-answer">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info Card */}
                <div className="info-card">
                    <span className="info-icon">⏰</span>
                    <div className="info-content">
                        <h3>Horário de Atendimento</h3>
                        <p>Segunda a Sexta: 9h às 18h</p>
                        <p>Sábado: 9h às 13h</p>
                    </div>
                </div>
            </div>

            {/* Chat Modal */}
            {showChat && (
                <div className="chat-modal">
                    <div className="chat-modal-header">
                        <div className="chat-support-info">
                            <div className="support-avatar">👩‍💼</div>
                            <div>
                                <span className="support-name">Suporte SlimFit</span>
                                <span className="support-status">Online</span>
                            </div>
                        </div>
                        <button className="close-chat" onClick={() => setShowChat(false)}>×</button>
                    </div>

                    <div className="chat-messages">
                        {chatMessages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.role}`}>
                                {msg.text}
                            </div>
                        ))}
                    </div>

                    <div className="chat-input">
                        <input
                            type="text"
                            placeholder="Digite sua mensagem..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button onClick={handleSendMessage}>📤</button>
                    </div>
                </div>
            )}
        </div>
    )
}
