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
import AIAssistantsButton from './components/AIAssistantsButton'



const ADMIN_EMAIL = 'admin@gmail.com'

function App() {
  const [activeTab, setActiveTab] = useState('feed')
  const [showAuth, setShowAuth] = useState(false)
  const { user, profile, loading } = useAuth()

  // Verifica admin usando o email do auth (mais confiável) ou do profile
  const isAdmin = user?.email === ADMIN_EMAIL || profile?.email === ADMIN_EMAIL

  // Lógica de Subdomínio Admin
  const isSubdomainAdmin = window.location.hostname.startsWith('admin.') || window.location.search.includes('admin=true')

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

  // Se não estiver logado
  if (!user) {
    return (
      <div className="app">
        <div className="welcome-screen">
          {/* Background animado */}
          <div className="welcome-bg">
            <div className="welcome-gradient-1"></div>
            <div className="welcome-gradient-2"></div>
            <div className="welcome-gradient-3"></div>
            <div className="welcome-particles"></div>
          </div>

          {/* Container principal com layout flex */}
          <div className="welcome-container">
            {/* Lado esquerdo - Conteúdo */}
            <div className="welcome-content">
              {isSubdomainAdmin && (
                <div style={{
                  marginBottom: '20px',
                  background: 'rgba(255, 64, 129, 0.2)',
                  color: '#FF4081',
                  padding: '10px 20px',
                  borderRadius: '50px',
                  display: 'inline-block',
                  fontWeight: 'bold',
                  border: '1px solid rgba(255, 64, 129, 0.4)'
                }}>
                  🔒 Área Administrativa
                </div>
              )}

              <div className="welcome-logo-mobile">
                <img src="/logo-clube-musas.png" alt="Clube das Musas" />
              </div>

              <h1 className="welcome-title">
                Clube das <span className="gradient-text">Musas</span>
              </h1>
              <p className="welcome-subtitle">Onde Mães Viram Musas</p>

              {/* Botão de Login direto se for Admin */}
              <button className="btn-primary btn-welcome" onClick={() => setShowAuth(true)}>
                <span className="btn-shine"></span>
                {isSubdomainAdmin ? 'Acessar Painel' : 'Começar Agora'}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              {!isSubdomainAdmin && (
                <p className="welcome-login" onClick={() => setShowAuth(true)}>
                  Já tem uma conta? <span>Entrar</span>
                </p>
              )}

              {/* Trust badges... (mantido simplificado para o diff) */}
              {!isSubdomainAdmin && (
                <div className="trust-badges">
                  <div className="trust-item"><span>⭐</span><span>4.9/5</span></div>
                  <div className="trust-item"><span>👩‍👧</span><span>10K+ Musas</span></div>
                  <div className="trust-item"><span>🔒</span><span>Seguro</span></div>
                </div>
              )}
            </div>

            {/* Lado direito - Mantido igual */}
            {!isSubdomainAdmin && (
              <div className="welcome-showcase">
                <div className="showcase-phone">
                  <div className="phone-frame">
                    <div className="phone-notch"></div>
                    <div className="phone-screen">
                      {/* ... Phone content ... */}
                      <div className="app-preview">
                        <div className="preview-header">
                          <img src="/logo-clube-musas.png" alt="Logo" className="preview-logo" />
                          <span className="preview-title">Clube das Musas</span>
                        </div>
                        <div className="preview-stats">
                          <div className="stat-card"><span className="stat-value">15</span></div>
                          <div className="stat-card"><span className="stat-value">-2kg</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <PWAInstallPrompt />
        <AuthModal isOpen={showAuth || isSubdomainAdmin} onClose={isSubdomainAdmin ? () => { } : () => setShowAuth(false)} />
      </div>
    )
  }

  // Renderização principal
  // Se for subdomínio admin, renderiza SOMENTE o AdminPanel
  if (isSubdomainAdmin) {
    return (
      <div className="app admin-mode">
        <main className="main-content" style={{ paddingBottom: 0 }}>
          <AdminPanel />
        </main>
      </div>
    )
  }

  // App Normal
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
        <AIAssistantsButton />
      </main>
      <PWAInstallPrompt />
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} />
    </div>
  )
}

export default App
