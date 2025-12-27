import { useState } from 'react'
import './App.css'
import { useAuth } from './contexts/AuthContext'

// Components
import AuthModal from './components/AuthModal'
import BottomNav from './components/BottomNav'
import Feed from './components/Feed'
import MemberArea from './components/MemberArea'
import AIAssistant from './components/AIAssistant'
import ChallengesPage from './components/ChallengesPage'
import ProfilePage from './components/ProfilePage'
import Support from './components/Support'
import AdminPanel from './components/AdminPanel'

const ADMIN_EMAIL = 'admin@gmail.com'

function App() {
  const [activeTab, setActiveTab] = useState('feed')
  const [showAuth, setShowAuth] = useState(false)
  const { user, profile, loading } = useAuth()

  const isAdmin = profile?.email === ADMIN_EMAIL

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader">
          <div className="loader-ring"></div>
          <div className="loader-ring"></div>
          <div className="loader-ring"></div>
          <span className="loader-text">Carregando...</span>
        </div>
      </div>
    )
  }

  // Se não estiver logado, mostrar tela de login premium
  if (!user) {
    return (
      <div className="app">
        <div className="welcome-screen">
          {/* Background animado */}
          <div className="welcome-bg">
            <div className="welcome-gradient-1"></div>
            <div className="welcome-gradient-2"></div>
            <div className="welcome-gradient-3"></div>
          </div>

          <div className="welcome-content">
            {/* Logo Premium */}
            <div className="welcome-logo-container">
              <div className="welcome-logo-glow"></div>
              <div className="welcome-logo">
                <span className="logo-icon">💎</span>
              </div>
            </div>

            <h1 className="welcome-title">
              Slim<span className="gradient-text">Fit</span>
            </h1>
            <p className="welcome-subtitle">Sua Jornada de Transformação Começa Aqui</p>

            <div className="welcome-features">
              <div className="welcome-feature">
                <div className="feature-icon">🎯</div>
                <div className="feature-content">
                  <span className="feature-title">Desafios Motivadores</span>
                  <span className="feature-desc">Alcance suas metas</span>
                </div>
              </div>
              <div className="welcome-feature">
                <div className="feature-icon">👥</div>
                <div className="feature-content">
                  <span className="feature-title">Comunidade Ativa</span>
                  <span className="feature-desc">Apoio e motivação</span>
                </div>
              </div>
              <div className="welcome-feature">
                <div className="feature-icon">🤖</div>
                <div className="feature-content">
                  <span className="feature-title">IA Personalizada</span>
                  <span className="feature-desc">Respostas inteligentes</span>
                </div>
              </div>
              <div className="welcome-feature">
                <div className="feature-icon">📚</div>
                <div className="feature-content">
                  <span className="feature-title">Aulas Exclusivas</span>
                  <span className="feature-desc">Conteúdo premium</span>
                </div>
              </div>
            </div>

            <button className="btn-primary btn-welcome" onClick={() => setShowAuth(true)}>
              <span className="btn-shine"></span>
              Começar Agora
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <p className="welcome-login" onClick={() => setShowAuth(true)}>
              Já tem uma conta? <span>Entrar</span>
            </p>

            {/* Trust badges */}
            <div className="trust-badges">
              <div className="trust-item">
                <span>⭐</span>
                <span>4.9/5</span>
              </div>
              <div className="trust-item">
                <span>👥</span>
                <span>10K+ membros</span>
              </div>
              <div className="trust-item">
                <span>🔒</span>
                <span>Seguro</span>
              </div>
            </div>
          </div>
        </div>
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    )
  }

  return (
    <div className="app">
      <main className="main-content">
        {activeTab === 'feed' && <Feed />}
        {activeTab === 'lessons' && <MemberArea />}
        {activeTab === 'ai' && <AIAssistant />}
        {activeTab === 'challenges' && <ChallengesPage />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'support' && <Support />}
        {activeTab === 'admin' && <AdminPanel />}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} />
    </div>
  )
}

export default App
