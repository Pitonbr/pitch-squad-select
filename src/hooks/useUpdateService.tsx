import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CacheManager } from "@/utils/cacheManager";

export interface UpdateInfo {
  version: string;
  features: string[];
  fixes: string[];
  critical: boolean;
  releaseDate: string;
  downloadSize?: string;
}

export function useUpdateService() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Simular dados de atualização (em produção, viria de uma API)
  const mockUpdates: UpdateInfo[] = [
    {
      version: "3.1.0",
      features: [
        "Sistema de notificações push para jogos",
        "Estatísticas avançadas de jogadores",
        "Modo offline melhorado"
      ],
      fixes: [
        "Correção na sincronização de dados",
        "Melhoria na performance do dashboard",
        "Correção de bugs menores na interface"
      ],
      critical: false,
      releaseDate: "2024-01-15",
      downloadSize: "2.3 MB"
    },
    {
      version: "3.0.1",
      features: [],
      fixes: [
        "Correção crítica de segurança",
        "Fix na autenticação de usuários",
        "Correção de bug que causava perda de dados"
      ],
      critical: true,
      releaseDate: "2024-01-10",
      downloadSize: "1.1 MB"
    }
  ];

  const checkForUpdates = useCallback(async (silent = false) => {
    if (isChecking) return;
    
    setIsChecking(true);
    
    try {
      if (!silent) {
        toast.info("Verificando atualizações...", { duration: 1000 });
      }

      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const currentVersion = localStorage.getItem('app_version') || '3.0.0';
      const availableUpdate = mockUpdates.find(update => 
        compareVersions(update.version, currentVersion) > 0
      );

      if (availableUpdate) {
        // Verificar se a atualização foi rejeitada recentemente
        const dismissed = localStorage.getItem('updateDismissed');
        const postponed = localStorage.getItem('updatePostponed');
        
        const now = Date.now();
        const shouldShow = !dismissed || 
          (dismissed && now - parseInt(dismissed) > 24 * 60 * 60 * 1000) || // 24h
          (postponed && now - parseInt(postponed) > 0) ||
          availableUpdate.critical;

        if (shouldShow) {
          setUpdateInfo(availableUpdate);
          setUpdateAvailable(true);
          
          if (!silent) {
            toast.success("Nova atualização disponível!", {
              description: `Versão ${availableUpdate.version} está pronta para instalação.`,
              duration: 3000,
            });
          }
        }
      } else if (!silent) {
        toast.success("Aplicação atualizada!", {
          description: "Você está usando a versão mais recente.",
          duration: 2000,
        });
      }

      setLastChecked(new Date());
      localStorage.setItem('lastUpdateCheck', Date.now().toString());

    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      if (!silent) {
        toast.error("Erro ao verificar atualizações", {
          description: "Verifique sua conexão com a internet.",
          duration: 3000,
        });
      }
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  const applyUpdate = useCallback(async (updateInfo: UpdateInfo) => {
    if (isUpdating) return false;
    
    setIsUpdating(true);
    
    try {
      toast.info("Preparando atualização...", {
        description: `Aplicando versão ${updateInfo.version}`,
        duration: 2000,
      });

      // Simular download e aplicação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Limpar caches
      await CacheManager.clearAllCaches();
      
      // Registrar nova versão
      localStorage.setItem('app_version', updateInfo.version);
      localStorage.setItem('update_applied', Date.now().toString());
      localStorage.removeItem('updateDismissed');
      localStorage.removeItem('updatePostponed');
      
      // Log da atualização
      console.log(`Atualização aplicada: v${updateInfo.version}`);
      
      toast.success("Atualização aplicada com sucesso!", {
        description: "A aplicação será recarregada em instantes.",
        duration: 2000,
      });

      // Recarregar após um breve delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);

      return true;

    } catch (error) {
      console.error('Erro ao aplicar atualização:', error);
      toast.error("Erro na atualização", {
        description: "Houve um problema ao aplicar a atualização. Tente novamente.",
        duration: 4000,
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
    setUpdateInfo(null);
    localStorage.setItem('updateDismissed', Date.now().toString());
  }, []);

  const postponeUpdate = useCallback((hours = 1) => {
    setUpdateAvailable(false);
    const postponeUntil = Date.now() + (hours * 60 * 60 * 1000);
    localStorage.setItem('updatePostponed', postponeUntil.toString());
  }, []);

  // Verificação automática periódica
  useEffect(() => {
    const interval = setInterval(() => {
      const lastCheck = localStorage.getItem('lastUpdateCheck');
      const now = Date.now();
      
      // Verificar de 30 em 30 minutos
      if (!lastCheck || now - parseInt(lastCheck) > 30 * 60 * 1000) {
        checkForUpdates(true);
      }
    }, 5 * 60 * 1000); // Verificar a cada 5 minutos

    // Verificação inicial
    checkForUpdates(true);

    return () => clearInterval(interval);
  }, [checkForUpdates]);

  // Escutar eventos do service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'UPDATE_AVAILABLE') {
          setUpdateInfo(event.data.updateInfo);
          setUpdateAvailable(true);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  return {
    updateAvailable,
    updateInfo,
    isChecking,
    isUpdating,
    lastChecked,
    checkForUpdates,
    applyUpdate,
    dismissUpdate,
    postponeUpdate,
  };
}

// Utilitário para comparar versões
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const partA = partsA[i] || 0;
    const partB = partsB[i] || 0;
    
    if (partA > partB) return 1;
    if (partA < partB) return -1;
  }
  
  return 0;
}