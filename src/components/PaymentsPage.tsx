import React, { useState } from 'react';
import { usePaymentGateways, PaymentGateway } from '../hooks/usePaymentGateways';
import './AdminPanel.css'; // Usando estilos do AdminPanel para consistência

export default function PaymentsPage() {
    const { gateways, loading, upsertGateway, deleteGateway } = usePaymentGateways();
    const [form, setForm] = useState<Partial<PaymentGateway>>({
        name: '',
        webhook_url: '',
        secret: '',
    });

    const handleSave = async () => {
        if (!form.name || !form.webhook_url) {
            alert('Preencha Nome e URL do Webhook');
            return;
        }
        await upsertGateway(form);
        setForm({ name: '', webhook_url: '', secret: '' });
        alert('Gateway salvo com sucesso!');
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este gateway?')) {
            await deleteGateway(id);
        }
    };

    const testWebhook = async (url: string) => {
        // Apenas simula um teste visual, já que não podemos garantir que a URL aceite POST sem payload real
        alert(`Para testar, envie uma requisição POST para: ${url}`);
    };

    return (
        <div className="admin-content">
            <div className="admin-header">
                <h2>💳 Integrações de Pagamento</h2>
                <p>Configure os gateways para liberação automática via Webhook.</p>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3>Adicionar / Editar Gateway</h3>
                <div className="form-grid" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr 1fr auto', alignItems: 'end' }}>
                    <div className="form-group">
                        <label>Nome (ex: Kiwify)</label>
                        <input
                            value={form.name || ''}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="Nome do Gateway"
                        />
                    </div>
                    <div className="form-group">
                        <label>URL do Webhook (Sua API)</label>
                        <input
                            value={form.webhook_url || ''}
                            onChange={e => setForm({ ...form, webhook_url: e.target.value })}
                            placeholder="https://...supabase.co/functions/v1/..."
                        />
                    </div>
                    <div className="form-group">
                        <label>Secret (Opcional)</label>
                        <input
                            value={form.secret || ''}
                            onChange={e => setForm({ ...form, secret: e.target.value })}
                            placeholder="Chave secreta para validação"
                        />
                    </div>
                    <button className="btn-primary" onClick={handleSave} style={{ marginBottom: '15px' }}>
                        Salvar
                    </button>
                </div>
            </div>

            <div className="card">
                <h3>Gateways Configurads</h3>
                {loading ? <p>Carregando...</p> : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Webhook URL</th>
                                    <th>Criado em</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gateways.length === 0 ? (
                                    <tr><td colSpan={4} style={{ textAlign: 'center' }}>Nenhum gateway configurado.</td></tr>
                                ) : (
                                    gateways.map(g => (
                                        <tr key={g.id}>
                                            <td>{g.name}</td>
                                            <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.webhook_url}</td>
                                            <td>{new Date(g.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-icon" onClick={() => setForm(g)} title="Editar">✏️</button>
                                                    <button className="btn-icon delete" onClick={() => handleDelete(g.id)} title="Excluir">🗑️</button>
                                                    <button className="btn-icon" onClick={() => testWebhook(g.webhook_url)} title="Ver Detalhes">🔍</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="card" style={{ marginTop: '2rem', backgroundColor: '#f5f5f5' }}>
                <h3>ℹ️ Como Configurar</h3>
                <ol style={{ marginLeft: '1.5rem', lineHeight: '1.6' }}>
                    <li>Crie um <strong>Webhook</strong> na sua plataforma de pagamento (Kiwify, Hotmart, etc).</li>
                    <li>Copie a URL da sua Edge Function (ex: <code>https://SEU_PROJETO.supabase.co/functions/v1/payment-webhook</code>).</li>
                    <li>Cole a URL no campo acima e salve para referência.</li>
                    <li>Nos seus <strong>Desafios</strong>, configure o campo "ID do Produto" para corresponder ao ID na plataforma de pagamento.</li>
                </ol>
            </div>
        </div>
    );
}
