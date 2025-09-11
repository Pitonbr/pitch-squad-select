import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar se já está em modo standalone (app instalado)
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listener para o evento beforeinstallprompt (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar prompt personalizado após 3 segundos
      setTimeout(() => {
        if (!isStandalone) {
          setShowInstallPrompt(true);
        }
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para iOS, mostrar instruções após 5 segundos se não estiver instalado
    if (iOS && !isStandalone) {
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
        setShowInstallPrompt(false);
      }
      
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Não mostrar novamente por 7 dias
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Verificar se foi dispensado recentemente
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      if (Date.now() - dismissedTime < sevenDays) {
        setShowInstallPrompt(false);
        return;
      }
    }
  }, []);

  if (isStandalone || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="border-primary bg-card/95 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-sm">Instalar Soccer Squad</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            {isIOS 
              ? "Adicione à sua tela inicial para acesso rápido e experiência nativa!"
              : "Instale o app para ter acesso rápido e usar offline!"
            }
          </p>

          {isIOS ? (
            <div className="space-y-3">
              <div className="text-xs bg-muted p-3 rounded-md">
                <p className="mb-2 font-medium">Como instalar no iOS:</p>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Toque no botão de compartilhar (□↑) no Safari</li>
                  <li>Role para baixo e toque em "Adicionar à Tela Inicial"</li>
                  <li>Toque em "Adicionar" no canto superior direito</li>
                </ol>
              </div>
              <Button 
                onClick={handleDismiss}
                className="w-full"
                size="sm"
              >
                Entendi
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleInstallClick}
                className="flex-1"
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Instalar App
              </Button>
              <Button
                variant="outline"
                onClick={handleDismiss}
                size="sm"
              >
                Depois
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;