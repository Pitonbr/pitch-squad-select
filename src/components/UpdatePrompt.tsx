import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, X, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { CacheManager } from "@/utils/cacheManager";

interface UpdatePromptProps {
  onUpdateComplete?: () => void;
}

function UpdatePrompt({ onUpdateComplete }: UpdatePromptProps) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateType, setUpdateType] = useState<'optional' | 'critical'>('optional');
  const [updateInfo, setUpdateInfo] = useState<{
    version: string;
    features: string[];
    fixes: string[];
  } | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkForUpdates = async () => {
      try {
        // Simular verificação de nova versão
        const currentVersion = await CacheManager.getCacheStatus();
        const lastCheck = localStorage.getItem('lastUpdateCheck');
        const now = Date.now();
        
        // Verificar de 30 em 30 minutos
        if (!lastCheck || now - parseInt(lastCheck) > 30 * 60 * 1000) {
          localStorage.setItem('lastUpdateCheck', now.toString());
          
          // Simular detecção de nova versão (seria real com service worker)
          const hasUpdate = Math.random() > 0.7; // 30% chance para demo
          
          if (hasUpdate) {
            setUpdateInfo({
              version: "3.1.0",
              features: [
                "Notificações de atualização automática",
                "Indicador de versão no cabeçalho",
                "Melhor gerenciamento de cache"
              ],
              fixes: [
                "Correção de bugs de sincronização",
                "Melhoria na performance"
              ]
            });
            setUpdateType(Math.random() > 0.8 ? 'critical' : 'optional');
            setShowUpdate(true);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
      }
    };

    // Verificar imediatamente e depois periodicamente
    checkForUpdates();
    timeoutId = setInterval(checkForUpdates, 30 * 60 * 1000); // 30 minutos

    // Escutar eventos do service worker para atualizações
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'UPDATE_AVAILABLE') {
          setUpdateInfo(event.data.updateInfo);
          setUpdateType(event.data.critical ? 'critical' : 'optional');
          setShowUpdate(true);
        }
      });
    }

    return () => {
      if (timeoutId) clearInterval(timeoutId);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      toast.info("Aplicando atualização...", {
        description: "Por favor, aguarde enquanto a aplicação é atualizada.",
        duration: 2000
      });

      // Aplicar a atualização
      await CacheManager.clearAllCaches();
      
      // Registrar nova versão
      if (updateInfo) {
        localStorage.setItem('app_version', updateInfo.version);
        localStorage.setItem('update_applied', Date.now().toString());
      }

      toast.success("Atualização aplicada!", {
        description: "A aplicação foi atualizada com sucesso.",
        duration: 2000
      });

      setTimeout(() => {
        onUpdateComplete?.();
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Erro ao aplicar atualização:', error);
      toast.error("Erro na atualização", {
        description: "Houve um problema ao aplicar a atualização. Tente novamente.",
        duration: 4000
      });
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    
    // Para atualizações opcionais, lembrar de não mostrar novamente por um tempo
    if (updateType === 'optional') {
      localStorage.setItem('updateDismissed', Date.now().toString());
    }
  };

  const handleLater = () => {
    setShowUpdate(false);
    // Lembrar por 1 hora para atualizações opcionais
    if (updateType === 'optional') {
      localStorage.setItem('updatePostponed', (Date.now() + 60 * 60 * 1000).toString());
    }
  };

  if (!showUpdate || !updateInfo) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto border-2 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {updateType === 'critical' ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : (
                <Download className="h-5 w-5 text-primary" />
              )}
              <CardTitle className="text-lg">
                Nova Atualização Disponível
              </CardTitle>
            </div>
            <Badge variant={updateType === 'critical' ? 'destructive' : 'secondary'}>
              v{updateInfo.version}
            </Badge>
          </div>
          <CardDescription>
            {updateType === 'critical' 
              ? "Esta é uma atualização crítica e deve ser aplicada imediatamente."
              : "Uma nova versão está disponível com melhorias e correções."
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Novidades */}
          {updateInfo.features.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Novidades
              </h4>
              <ul className="text-sm space-y-1">
                {updateInfo.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Correções */}
          {updateInfo.fixes.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">
                Correções
              </h4>
              <ul className="text-sm space-y-1">
                {updateInfo.fixes.map((fix, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{fix}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleUpdate} 
              disabled={isUpdating}
              className="flex-1"
              variant={updateType === 'critical' ? 'destructive' : 'default'}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Atualizar Agora
                </>
              )}
            </Button>
            
            {updateType === 'optional' && (
              <>
                <Button variant="outline" onClick={handleLater} disabled={isUpdating}>
                  Depois
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDismiss} disabled={isUpdating}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {updateType === 'critical' && (
            <p className="text-xs text-muted-foreground text-center">
              Atualizações críticas são necessárias para manter a segurança da aplicação.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default UpdatePrompt;