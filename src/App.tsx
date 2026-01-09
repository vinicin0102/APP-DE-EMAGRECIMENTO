import { useState, useEffect, lazy, Suspense, useMemo } from 'react'
import './App.css'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabase'

// Components - Lazy loading para melhor performance (com tratamento de erro)
const AuthModal = lazy(() => import('./components/AuthModal').catch(() => ({ default: () => <div>Erro ao carregar</div> })))
const BottomNav = lazy(() => import('./components/BottomNav').catch(() => ({ default: () => <div>Erro ao carregar</div> })))
const Feed = lazy(() => import('./components/Feed').catch(() => ({ default: () => <div>Erro ao carregar Feed</div> })))
const MemberArea = lazy(() => import('./components/MemberArea').catch(() => ({ default: () => <div>Erro ao carregar Área de Membros</div> })))
const ChallengesPage = lazy(() => import('./components/ChallengesPage').catch(() => ({ default: () => <div>Erro ao carregar Desafios</div> })))
const ProgressTracker = lazy(() => import('./components/ProgressTracker').catch(() => ({ default: () => <div>Erro ao carregar Progresso</div> })))
const MeuPlano = lazy(() => import('./components/MeuPlano').catch(() => ({ default: () => <div>Erro ao carregar Meu Plano</div> })))
const ProfilePage = lazy(() => import('./components/ProfilePage').catch(() => ({ default: () => <div>Erro ao carregar Perfil</div> })))
const Support = lazy(() => import('./components/Support').catch(() => ({ default: () => <div>Erro ao carregar Suporte</div> })))
const AdminPanel = lazy(() => import('./components/AdminPanel').catch(() => ({ default: () => <div>Erro ao carregar Admin</div> })))
const PWAInstallPrompt = lazy(() => import('./components/PWAInstallPrompt').then(m => ({ default: m.PWAInstallPrompt })).catch(() => ({ default: () => null })))
const AIAssistantsButton = lazy(() => import('./components/AIAssistantsButton').catch(() => ({ default: () => null })))
const ReloadPrompt = lazy(() => import('./components/ReloadPrompt').then(m => ({ default: m.ReloadPrompt })).catch(() => ({ default: () => null })))

const ADMIN_EMAILS = ['admin@gmail.com', 'vv9250400@gmail.com']

// Loading component
const TabLoader = () => (
  <div className="tab-loading">
    <div className="loader-spinner"></div>
  </div>
)

function App() {
  const [activeTab, setActiveTab] = useState('feed')
  const [showAuth, setShowAuth] = useState(false)
  const [hasPlanActive, setHasPlanActive] = useState(false)
  const { user, profile, loading } = useAuth()

  // Verificar status do plano do usuário - com cache (CORRIGIDO: removido loop infinito)
  useEffect(() => {
    const checkPlanStatus = async () => {
      if (!user) {
        setHasPlanActive(false)
        sessionStorage.removeItem('plan_status')
        return
      }

      // Verificar cache primeiro
      const cached = sessionStorage.getItem('plan_status')
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          // Cache válido por 5 minutos
          if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
            setHasPlanActive(parsed.hasPlanActive)
            return
          }
        } catch (e) {
          // Ignore cache inválido
        }
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
          sessionStorage.setItem('plan_status', JSON.stringify({ 
            hasPlanActive: false, 
            timestamp: Date.now() 
          }))
          return
        }

        const expiresAt = new Date(data.expires_at)
        const now = new Date()
        const isActive = expiresAt > now
        setHasPlanActive(isActive)
        
        // Salvar no cache
        sessionStorage.setItem('plan_status', JSON.stringify({ 
          hasPlanActive: isActive, 
          timestamp: Date.now() 
        }))
      } catch (err) {
        console.error('Erro ao verificar plano:', err)
        setHasPlanActive(false)
      }
    }

    checkPlanStatus()
  }, [user]) // CORRIGIDO: removido planStatusCache da dependência para evitar loop infinito

  // Verifica admin na lista de emails permitidos
  const isAdmin = useMemo(() => {
    const userEmail = user?.email?.toLowerCase().trim()
    const profileEmail = profile?.email?.toLowerCase().trim()
    const adminCheck = ADMIN_EMAILS.some(email =>
      email.toLowerCase() === userEmail || email.toLowerCase() === profileEmail
    )
    
    // Log para debug
    if (user) {
      console.log('🔍 Verificação de Admin:', {
        userEmail,
        profileEmail,
        adminEmails: ADMIN_EMAILS,
        isAdmin: adminCheck
      })
    }
    
    return adminCheck
  }, [user?.email, profile?.email])

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
        <Suspense fallback={null}>
          <PWAInstallPrompt />
          <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="app">
      <main className="main-content">
        {/* Renderizar todos os componentes mas ocultar os inativos - evita desmontar/remontar */}
        <div style={{ display: activeTab === 'feed' ? 'block' : 'none' }}>
          <Suspense fallback={<TabLoader />}>
            <Feed />
          </Suspense>
        </div>
        
        <div style={{ display: activeTab === 'lessons' ? 'block' : 'none' }}>
          <Suspense fallback={<TabLoader />}>
            {hasPlanActive ? <MemberArea /> : (
              <div className="locked-content-screen">
                <div className="locked-icon">🔒</div>
                <h2>Conteúdo Exclusivo</h2>
                <p>Esta área é exclusiva para assinantes do plano premium.</p>
                <button className="btn-primary" onClick={() => setActiveTab('progress')}>
                  Quero Assinar Agora
                </button>
              </div>
            )}
          </Suspense>
        </div>
        
        <div style={{ display: activeTab === 'plano' ? 'block' : 'none' }}>
          <Suspense fallback={<TabLoader />}>
            <MeuPlano />
          </Suspense>
        </div>
        
        <div style={{ display: activeTab === 'progress' ? 'block' : 'none' }}>
          <Suspense fallback={<TabLoader />}>
            <ProgressTracker />
            {hasPlanActive && <AIAssistantsButton />}
          </Suspense>
        </div>
        
        <div style={{ display: activeTab === 'challenges' ? 'block' : 'none' }}>
          <Suspense fallback={<TabLoader />}>
            <ChallengesPage />
          </Suspense>
        </div>
        
        <div style={{ display: activeTab === 'profile' ? 'block' : 'none' }}>
          <Suspense fallback={<TabLoader />}>
            <ProfilePage />
          </Suspense>
        </div>
        
        <div style={{ display: activeTab === 'support' ? 'block' : 'none' }}>
          <Suspense fallback={<TabLoader />}>
            <Support />
          </Suspense>
        </div>
        
        <div style={{ display: activeTab === 'admin' ? 'block' : 'none' }}>
          <Suspense fallback={<TabLoader />}>
            <AdminPanel />
          </Suspense>
        </div>
      </main>
      
      <Suspense fallback={null}>
        <PWAInstallPrompt />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} />
        <ReloadPrompt />
      </Suspense>
    </div>
  )
}

export default App
