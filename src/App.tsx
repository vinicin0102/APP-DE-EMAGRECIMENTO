import { useState, useEffect } from 'react'
import './App.css'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabase'

// Components
import AuthModal from './components/AuthModal'
import BottomNav from './components/BottomNav'
import Feed from './components/Feed'
import MemberArea from './components/MemberArea'
import ChallengesPage from './components/ChallengesPage'
import ProgressTracker from './components/ProgressTracker'
import ProfilePage from './components/ProfilePage'
import Support from './components/Support'
import AdminPanel from './components/AdminPanel'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import AIAssistantsButton from './components/AIAssistantsButton'

const ADMIN_EMAILS = ['admin@gmail.com', 'vv9250400@gmail.com']

function App() {
  const [activeTab, setActiveTab] = useState('feed')
  const [showAuth, setShowAuth] = useState(false)
  const [hasPlanActive, setHasPlanActive] = useState(false)
  const { user, profile, loading } = useAuth()

  // Verificar status do plano do usuário
  useEffect(() => {
    const checkPlanStatus = async () => {
      if (!user) {
        setHasPlanActive(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('individual_plans')
          .select('expires_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error || !data) {
          setHasPlanActive(false)
          return
        }

        const expiresAt = new Date(data.expires_at)
        const now = new Date()
        setHasPlanActive(expiresAt > now)
      } catch (err) {
        console.error('Erro ao verificar plano:', err)
        setHasPlanActive(false)
      }
    }

    checkPlanStatus()
  }, [user])

  // Verifica admin na lista de emails permitidos
  const userEmail = user?.email?.toLowerCase().trim()
  const profileEmail = profile?.email?.toLowerCase().trim()

  const isAdmin = ADMIN_EMAILS.some(email =>
    email.toLowerCase() === userEmail || email.toLowerCase() === profileEmail
  )

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
            <div className="welcome-particles"></div>
          </div>

          {/* Container principal com layout flex */}
          <div className="welcome-container">
            {/* Lado esquerdo - Conteúdo */}
            <div className="welcome-content">
              {/* Logo no topo para mobile */}
              <div className="welcome-logo-mobile">
                <img src="/logo-clube-musas.png" alt="Clube das Musas" />
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

            {/* Lado direito - Mockup do app (apenas desktop) */}
            <div className="welcome-showcase">
              <div className="showcase-phone">
                <div className="phone-frame">
                  <div className="phone-notch"></div>
                  <div className="phone-screen">
                    <div className="app-preview">
                      <div className="preview-header">
                        <img src="/logo-clube-musas.png" alt="Logo" className="preview-logo" />
                        <span className="preview-title">Clube das Musas</span>
                      </div>
                      <div className="preview-stats">
                        <div className="stat-card">
                          <span className="stat-emoji">🔥</span>
                          <span className="stat-value">15 dias</span>
                          <span className="stat-label">Sequência</span>
                        </div>
                        <div className="stat-card">
                          <span className="stat-emoji">⚡</span>
                          <span className="stat-value">2.5kg</span>
                          <span className="stat-label">Perdidos</span>
                        </div>
                      </div>
                      <div className="preview-progress">
                        <div className="progress-title">Seu Progresso</div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill"></div>
                        </div>
                        <span className="progress-text">75% da meta</span>
                      </div>
                      <div className="preview-challenges">
                        <div className="challenge-item active">
                          <span>🌸</span>
                          <span>Desafio 21 Dias</span>
                          <span className="check">✓</span>
                        </div>
                        <div className="challenge-item">
                          <span>💪</span>
                          <span>Mamãe Fitness</span>
                          <span className="arrow">→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Glow atrás do celular */}
                <div className="phone-glow"></div>
              </div>

              {/* Floating elements */}
              <div className="floating-badge badge-1">
                <span>🏆</span>
                <span>Top 10 Apps Fitness</span>
              </div>
              <div className="floating-badge badge-2">
                <span>❤️</span>
                <span>+10K Mamães</span>
              </div>
              <div className="floating-badge badge-3">
                <span>⭐</span>
                <span>4.9 Avaliações</span>
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
        {activeTab === 'lessons' && (hasPlanActive ? <MemberArea /> : (
          <div className="locked-content-screen">
            <div className="locked-icon">🔒</div>
            <h2>Conteúdo Exclusivo</h2>
            <p>Esta área é exclusiva para assinantes do plano premium.</p>
            <button className="btn-primary" onClick={() => setActiveTab('progress')}>
              Quero Assinar Agora
            </button>
          </div>
        ))}
        {activeTab === 'progress' && <ProgressTracker />}
        {activeTab === 'challenges' && <ChallengesPage />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'support' && <Support />}
        {activeTab === 'admin' && <AdminPanel />}
        {activeTab === 'progress' && hasPlanActive && <AIAssistantsButton />}
      </main>
      <PWAInstallPrompt />
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} />
    </div>
  )
}

export default App
