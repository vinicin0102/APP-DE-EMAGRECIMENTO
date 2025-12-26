import './BottomNav.css'

interface BottomNavProps {
    activeTab: string
    setActiveTab: (tab: string) => void
    isAdmin?: boolean
}

export default function BottomNav({ activeTab, setActiveTab, isAdmin }: BottomNavProps) {
    const navItems = [
        { id: 'feed', label: 'Feed', icon: '🏠' },
        { id: 'lessons', label: 'Aulas', icon: '📚' },
        { id: 'ai', label: 'IA', icon: '🤖' },
        { id: 'challenges', label: 'Desafios', icon: '🏆' },
        { id: 'profile', label: 'Perfil', icon: '👤' },
    ]

    // Adicionar aba admin se for administrador
    if (isAdmin) {
        navItems.push({ id: 'admin', label: 'Admin', icon: '⚙️' })
    }

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-container">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''} ${item.id === 'admin' ? 'admin-nav' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                        {activeTab === item.id && <div className="nav-indicator" />}
                    </button>
                ))}
            </div>
        </nav>
    )
}
