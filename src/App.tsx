import { useState } from 'react'
import './App.css'
import { useAuth } from './contexts/AuthContext'

// Components
import AuthModal from './components/AuthModal'
import BottomNav from './components/BottomNav'
import Feed from './components/Feed'
import MemberArea from './components/MemberArea'
import PlanGenerator from './components/PlanGenerator'
import ChallengesPage from './components/ChallengesPage'
import ProgressTracker from './components/ProgressTracker'
import ProfilePage from './components/ProfilePage'
import Support from './components/Support'
import AdminPanel from './components/AdminPanel'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'

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
                <img src="/logo-clube-musas.png" alt="Clube das Musas" className="logo-image" />
              </div>
            </div>

            <h1 className="welcome-title">
              Clube das <span className="gradient-text">Musas</span>
            </h1>
            <p className="welcome-subtitle">Onde Mães Viram Musas</p>

            <div className="welcome-features">
              <div className="welcome-feature">
                <div className="feature-icon">🌸</div>
                <div className="feature-content">
                  <span className="feature-title">Desafios</span>
                  <span className="feature-desc">Evolua em tempo recorde</span>
                </div>
              </div>
              <div className="welcome-feature">
                <div className="feature-icon">🤍</div>
                <div className="feature-content">
                  <span className="feature-title">Comunidade de Musas</span>
                  <span className="feature-desc">Apoio, acolhimento e motivação</span>
                </div>
              </div>
              <div className="welcome-feature">
                <div className="feature-icon">💪</div>
                <div className="feature-content">
                  <span className="feature-title">Planos Seguros & Personalizados</span>
                  <span className="feature-desc">Treinos e dietas pensadas para mães</span>
                </div>
              </div>
              <div className="welcome-feature">
                <div className="feature-icon">🎥</div>
                <div className="feature-content">
                  <span className="feature-title">Aulas & Guia de Recuperação</span>
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
                <span>👩‍👧</span>
                <span>10K+ Musas</span>
              </div>
              <div className="trust-item">
                <span>🔒</span>
                <span>Seguro</span>
              </div>
            </div>
          </div>
        </div>
        <PWAInstallPrompt />
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    )
  }

  return (
    <div className="app">
      <main className="main-content">
        {activeTab === 'feed' && <Feed />}
        {activeTab === 'lessons' && <MemberArea />}
        {activeTab === 'progress' && <ProgressTracker />}
        {activeTab === 'challenges' && <ChallengesPage />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'support' && <Support />}
        {activeTab === 'admin' && <AdminPanel />}
      </main>
      <PWAInstallPrompt />
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} />
    </div>
  )
}

export default App
