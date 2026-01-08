import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './AuthModal.css'

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn, signUp } = useAuth()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (mode === 'login') {
                console.log('🔐 Iniciando processo de login...')
                const { error } = await signIn(email.trim(), password)
                if (error) {
                    console.error('❌ Erro no login:', error)
                    // Mensagens de erro mais amigáveis
                    let errorMessage = 'Erro ao fazer login'
                    if (error.message.includes('Invalid login credentials')) {
                        errorMessage = 'Email ou senha incorretos'
                    } else if (error.message.includes('Email not confirmed')) {
                        errorMessage = 'Por favor, confirme seu email antes de fazer login'
                    } else if (error.message.includes('Too many requests')) {
                        errorMessage = 'Muitas tentativas. Aguarde alguns minutos'
                    } else {
                        errorMessage = error.message || 'Erro ao fazer login'
                    }
                    throw new Error(errorMessage)
                }
                console.log('✅ Login bem-sucedido!')
            } else {
                if (!name.trim()) {
                    throw new Error('Nome é obrigatório')
                }
                const { error } = await signUp(email.trim(), password, name.trim())
                if (error) {
                    let errorMessage = 'Erro ao criar conta'
                    if (error.message.includes('already registered')) {
                        errorMessage = 'Este email já está cadastrado. Tente fazer login'
                    } else if (error.message.includes('Password')) {
                        errorMessage = 'A senha deve ter pelo menos 6 caracteres'
                    } else {
                        errorMessage = error.message || 'Erro ao criar conta'
                    }
                    throw new Error(errorMessage)
                }
            }
            // Aguardar um pouco para garantir que o estado foi atualizado
            await new Promise(resolve => setTimeout(resolve, 500))
            onClose()
        } catch (err: any) {
            console.error('❌ Erro no handleSubmit:', err)
            setError(err.message || 'Ocorreu um erro')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <div className="modal-header">
                    <div className="modal-logo">
                        <img src="/logo-clube-musas.png" alt="Clube das Musas" />
                    </div>
                    <h2>{mode === 'login' ? 'Bem-vindo de volta!' : 'Criar conta'}</h2>
                    <p>{mode === 'login'
                        ? 'Entre para continuar sua jornada'
                        : 'Comece sua transformação hoje'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {mode === 'signup' && (
                        <div className="form-group">
                            <label htmlFor="name">Nome</label>
                            <input
                                id="name"
                                type="text"
                                placeholder="Seu nome"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn-primary btn-submit" disabled={loading}>
                        {loading ? 'Carregando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>ou</span>
                </div>

                <button
                    className="btn-toggle-mode"
                    onClick={() => {
                        setMode(mode === 'login' ? 'signup' : 'login')
                        setError('')
                    }}
                >
                    {mode === 'login'
                        ? 'Não tem conta? Cadastre-se'
                        : 'Já tem conta? Entrar'}
                </button>
            </div>
        </div>
    )
}
