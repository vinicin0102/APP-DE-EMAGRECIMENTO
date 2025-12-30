import { useEffect, useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import './PWAInstallPrompt.css';

export function PWAInstallPrompt() {
    const {
        isInstallable,
        isInstalled,
        isIOS,
        showIOSInstructions,
        promptInstall,
        hideIOSInstructions
    } = usePWAInstall();

    const [showPrompt, setShowPrompt] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if prompt was previously dismissed
        const wasDismissed = localStorage.getItem('pwa-install-dismissed');
        const dismissedTime = wasDismissed ? parseInt(wasDismissed, 10) : 0;
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        // Show prompt if installable OR if iOS and not installed
        if (!isInstalled && !dismissed && dismissedTime < oneDayAgo) {
            // Delay showing the prompt for better UX
            const timer = setTimeout(() => {
                if (isInstallable || (isIOS && !isInstalled)) {
                    setShowPrompt(true);
                }
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isInstallable, isInstalled, isIOS, dismissed]);

    const handleInstallClick = async () => {
        await promptInstall();
        if (!isIOS) {
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setDismissed(true);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    if (isInstalled || (!showPrompt && !showIOSInstructions)) {
        return null;
    }

    // iOS Instructions Modal
    if (showIOSInstructions) {
        return (
            <div className="pwa-modal-overlay" onClick={hideIOSInstructions}>
                <div className="pwa-modal ios-instructions" onClick={e => e.stopPropagation()}>
                    <button className="pwa-modal-close" onClick={hideIOSInstructions}>
                        ✕
                    </button>

                    <div className="pwa-modal-icon">
                        <img src="/icon-512x512.png" alt="Clube das Musas" className="app-icon" />
                    </div>

                    <h2>Instalar Clube das Musas</h2>
                    <p>Instale o app na tela inicial do seu iPhone para acesso rápido!</p>

                    <div className="ios-steps">
                        <div className="ios-step">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <span>Toque no botão</span>
                                <svg className="share-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                                    <polyline points="16,6 12,2 8,6" />
                                    <line x1="12" y1="2" x2="12" y2="15" />
                                </svg>
                                <span>na barra inferior do Safari</span>
                            </div>
                        </div>

                        <div className="ios-step">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <span>Role para baixo e toque em</span>
                                <div className="action-badge">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <line x1="12" y1="8" x2="12" y2="16" />
                                        <line x1="8" y1="12" x2="16" y2="12" />
                                    </svg>
                                    Adicionar à Tela de Início
                                </div>
                            </div>
                        </div>

                        <div className="ios-step">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <span>Confirme tocando em</span>
                                <span className="highlight">Adicionar</span>
                            </div>
                        </div>
                    </div>

                    <button className="btn-got-it" onClick={hideIOSInstructions}>
                        Entendi!
                    </button>
                </div>
            </div>
        );
    }

    // Standard Install Prompt (Android/Desktop)
    return (
        <div className="pwa-install-banner">
            <div className="pwa-banner-content">
                <div className="pwa-banner-icon">
                    <img src="/icon-512x512.png" alt="Clube das Musas" className="app-icon-small" />
                </div>

                <div className="pwa-banner-text">
                    <strong>Instalar Clube das Musas</strong>
                    <span>Acesse rapidamente direto da sua tela inicial</span>
                </div>

                <div className="pwa-banner-actions">
                    <button className="btn-install" onClick={handleInstallClick}>
                        Instalar
                    </button>
                    <button className="btn-dismiss" onClick={handleDismiss}>
                        Depois
                    </button>
                </div>
            </div>
        </div>
    );
}
