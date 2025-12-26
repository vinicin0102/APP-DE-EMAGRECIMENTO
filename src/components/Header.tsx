import { useAuth } from '../contexts/AuthContext'
import './Header.css'

interface HeaderProps {
    onAuthClick: () => void
}

export default function Header({ onAuthClick }: HeaderProps) {
    const { user, profile, signOut } = useAuth()

    return (
        <header className="header">
            <div className="header-container">
                <div className="logo">
                    <div className="logo-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="logo-text">
                        <span className="gradient-text">Slim</span>Fit
                    </span>
                </div>

                <nav className="nav-desktop">
                    <a href="#home" className="nav-link active">Início</a>
                    <a href="#features" className="nav-link">Funcionalidades</a>
                    <a href="#community" className="nav-link">Comunidade</a>
                    <a href="#challenges" className="nav-link">Desafios</a>
                </nav>

                <div className="header-actions">
                    {user ? (
                        <>
                            <div className="user-info">
                                <div className="user-avatar-small">
                                    {profile?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span className="user-name-small">{profile?.name || 'Usuário'}</span>
                            </div>
                            <button className="btn-login" onClick={signOut}>Sair</button>
                        </>
                    ) : (
                        <>
                            <button className="btn-login" onClick={onAuthClick}>Entrar</button>
                            <button className="btn-primary btn-cta" onClick={onAuthClick}>Começar Grátis</button>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
