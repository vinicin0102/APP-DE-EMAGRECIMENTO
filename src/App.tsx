import { useState } from 'react'
import './App.css'
import { useAuth } from './contexts/AuthContext'

// Components
import AuthModal from './components/AuthModal'
import BottomNav from './components/BottomNav'
import Feed from './components/Feed'
import Lessons from './components/Lessons'
import AIAssistant from './components/AIAssistant'
import ChallengesPage from './components/ChallengesPage'
import ProfilePage from './components/ProfilePage'
import Support from './components/Support'

function App() {
  const [activeTab, setActiveTab] = useState('feed')
  const [showAuth, setShowAuth] = useState(false)
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader">
          <span className="loader-emoji">💪</span>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  // Se não estiver logado, mostrar tela de login
  if (!user) {
    return (
      <div className="app">
        <div className="welcome-screen">
          <div className="welcome-content">
            <div className="welcome-logo">💪</div>
            <h1>Slim<span className="gradient-text">Fit</span></h1>
            <p>Sua jornada de transformação começa aqui</p>

            <div className="welcome-features">
              <div className="welcome-feature">
                <span>🎯</span>
                <span>Desafios motivadores</span>
              </div>
              <div className="welcome-feature">
                <span>👥</span>
                <span>Comunidade ativa</span>
              </div>
              <div className="welcome-feature">
                <span>🤖</span>
                <span>IA personalizada</span>
              </div>
              <div className="welcome-feature">
                <span>📚</span>
                <span>Aulas exclusivas</span>
              </div>
            </div>

            <button className="btn-primary btn-welcome" onClick={() => setShowAuth(true)}>
              Começar Agora
            </button>
            <p className="welcome-login" onClick={() => setShowAuth(true)}>
              Já tem uma conta? <span>Entrar</span>
            </p>
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
        {activeTab === 'lessons' && <Lessons />}
        {activeTab === 'ai' && <AIAssistant />}
        {activeTab === 'challenges' && <ChallengesPage />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'support' && <Support />}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default App
