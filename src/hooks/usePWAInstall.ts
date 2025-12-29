import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

declare global {
    interface WindowEventMap {
        'beforeinstallprompt': BeforeInstallPromptEvent;
    }
}

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    useEffect(() => {
        // Detect iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
        setIsIOS(iOS);

        // Detect Android
        const android = /Android/.test(navigator.userAgent);
        setIsAndroid(android);

        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone);
        setIsInstalled(isStandalone);

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for app installed event
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = useCallback(async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstalled(true);
            }
            setDeferredPrompt(null);
            setIsInstallable(false);
        } else if (isIOS) {
            setShowIOSInstructions(true);
        }
    }, [deferredPrompt, isIOS]);

    const hideIOSInstructions = useCallback(() => {
        setShowIOSInstructions(false);
    }, []);

    return {
        isInstallable,
        isInstalled,
        isIOS,
        isAndroid,
        showIOSInstructions,
        promptInstall,
        hideIOSInstructions
    };
}
