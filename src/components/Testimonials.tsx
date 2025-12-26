import './Testimonials.css'

const testimonials = [
    {
        id: 1,
        name: 'Fernanda Rodrigues',
        avatar: 'F',
        color: '#FF4081',
        role: 'Perdeu 25kg em 8 meses',
        rating: 5,
        content: 'Eu já tinha tentado de tudo antes de encontrar essa comunidade. O apoio diário, os desafios e ver outras pessoas conquistando seus objetivos me motivaram a não desistir. Hoje me sinto outra pessoa!',
    },
    {
        id: 2,
        name: 'Marcos Almeida',
        avatar: 'M',
        color: '#2979FF',
        role: 'Perdeu 18kg em 5 meses',
        rating: 5,
        content: 'O melhor app de emagrecimento que já usei! A funcionalidade de desafios é incrível e me mantém comprometido. Os gráficos de progresso são muito motivadores.',
    },
    {
        id: 3,
        name: 'Juliana Costa',
        avatar: 'J',
        color: '#7C4DFF',
        role: 'Perdeu 12kg em 4 meses',
        rating: 5,
        content: 'As receitas compartilhadas pela comunidade são sensacionais! Aprendi a comer de forma saudável sem abrir mão do sabor. Super recomendo!',
    },
]

export default function Testimonials() {
    return (
        <section className="testimonials-section">
            <h2>
                O que nossos membros
                <span className="highlight"> dizem</span>
            </h2>
            <p className="section-subtitle">
                Histórias reais de transformação que acontecem todos os dias
            </p>

            <div className="testimonials-grid">
                {testimonials.map((testimonial, index) => (
                    <div
                        key={testimonial.id}
                        className="testimonial-card"
                        style={{ animationDelay: `${index * 0.15}s` }}
                    >
                        <div className="testimonial-header">
                            <div
                                className="testimonial-avatar"
                                style={{ background: testimonial.color }}
                            >
                                {testimonial.avatar}
                            </div>
                            <div className="testimonial-info">
                                <span className="testimonial-name">{testimonial.name}</span>
                                <span className="testimonial-role">{testimonial.role}</span>
                            </div>
                        </div>

                        <div className="testimonial-rating">
                            {[...Array(testimonial.rating)].map((_, i) => (
                                <span key={i} className="star">⭐</span>
                            ))}
                        </div>

                        <p className="testimonial-content">"{testimonial.content}"</p>

                        <div className="testimonial-quote">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>

            <div className="testimonials-cta">
                <button className="btn-primary">
                    Comece sua transformação
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </section>
    )
}
