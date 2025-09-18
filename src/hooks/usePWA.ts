import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (installed as PWA)
    const checkStandalone = () => {
      try {
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone ||
          document.referrer.includes('android-app://');
        
        setIsStandalone(isStandaloneMode);
        setIsInstalled(isStandaloneMode);
      } catch (error) {
        console.error('Error checking PWA status:', error);
      }
    };

    checkStandalone();

    // Listen for changes in display mode
    let mediaQuery: MediaQueryList | null = null;
    
    try {
      mediaQuery = window.matchMedia('(display-mode: standalone)');
      mediaQuery.addEventListener('change', checkStandalone);
    } catch (error) {
      console.error('Error setting up media query listener:', error);
    }

    return () => {
      if (mediaQuery) {
        try {
          mediaQuery.removeEventListener('change', checkStandalone);
        } catch (error) {
          console.error('Error removing media query listener:', error);
        }
      }
    };
  }, []);

  return {
    isInstalled,
    isStandalone
  };
};