import './Features.css'

const features = [
    {
        icon: '🎯',
        title: 'Metas Personalizadas',
        description: 'Defina metas realistas e acompanhe seu progresso diário com gráficos detalhados.',
        gradient: 'linear-gradient(135deg, #00C853, #69F0AE)',
    },
    {
        icon: '👥',
        title: 'Comunidade Ativa',
        description: 'Conecte-se com milhares de pessoas que compartilham os mesmos objetivos.',
        gradient: 'linear-gradient(135deg, #FF4081, #FF6EC7)',
    },
    {
        icon: '🏆',
        title: 'Desafios Semanais',
        description: 'Participe de desafios motivadores e ganhe pontos, medalhas e prêmios exclusivos.',
        gradient: 'linear-gradient(135deg, #7C4DFF, #B388FF)',
    },
    {
        icon: '📊',
        title: 'Acompanhamento',
        description: 'Registre peso, medidas, alimentação e exercícios em um só lugar.',
        gradient: 'linear-gradient(135deg, #2979FF, #82B1FF)',
    },
    {
        icon: '🍎',
        title: 'Receitas Saudáveis',
        description: 'Acesse receitas deliciosas e nutritivas compartilhadas pela comunidade.',
        gradient: 'linear-gradient(135deg, #FF6D00, #FFAB40)',
    },
    {
        icon: '💬',
        title: 'Suporte 24/7',
        description: 'Tire dúvidas e receba motivação a qualquer momento do dia.',
        gradient: 'linear-gradient(135deg, #00BCD4, #84FFFF)',
    },
]

export default function Features() {
    return (
        <section id="features" className="features-section">
            <h2>
                Tudo que você precisa para sua
                <span className="highlight"> transformação</span>
            </h2>
            <p className="section-subtitle">
                Ferramentas poderosas para você alcançar seus objetivos de forma saudável e sustentável
            </p>

            <div className="features-grid">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="feature-card"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div
                            className="feature-icon"
                            style={{ background: feature.gradient }}
                        >
                            {feature.icon}
                        </div>
                        <h3>{feature.title}</h3>
                        <p>{feature.description}</p>
                        <div className="feature-glow" style={{ background: feature.gradient }}></div>
                    </div>
                ))}
            </div>
        </section>
    )
}
