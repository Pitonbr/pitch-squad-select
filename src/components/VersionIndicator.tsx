import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Info, RefreshCw, Database, Wifi, WifiOff } from "lucide-react";
import { CacheManager } from "@/utils/cacheManager";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function VersionIndicator() {
  const [version, setVersion] = useState("3.0.0");
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [buildTime, setBuildTime] = useState<string | null>(null);

  useEffect(() => {
    const loadVersionInfo = async () => {
      try {
        // Obter status do cache
        const status = await CacheManager.getCacheStatus();
        setCacheStatus(status);
        
        // Obter versão atual
        const storedVersion = localStorage.getItem('app_version') || version;
        setVersion(storedVersion);
        
        // Obter data da última atualização
        const updateTime = localStorage.getItem('update_applied');
        if (updateTime) {
          setLastUpdate(format(new Date(parseInt(updateTime)), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }));
        }
        
        // Simular build time (seria real em produção)
        setBuildTime(format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR }));
        
      } catch (error) {
        console.error('Erro ao carregar informações de versão:', error);
      }
    };

    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    
    loadVersionInfo();
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const handleForceUpdate = () => {
    CacheManager.forceRefresh();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>v{version}</span>
            {isOnline ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-500" />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">Informações da Aplicação</h4>
            <Badge variant="outline" className="text-xs">
              Soccer Squad
            </Badge>
          </div>
          
          <div className="space-y-3 text-sm">
            {/* Versão */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Versão:</span>
              <Badge variant="secondary">v{version}</Badge>
            </div>
            
            {/* Status Online */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status:</span>
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500" />
                    <span className="text-red-600">Offline</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Build Time */}
            {buildTime && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Build:</span>
                <span className="font-mono text-xs">{buildTime}</span>
              </div>
            )}
            
            {/* Última Atualização */}
            {lastUpdate && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Última Atualização:</span>
                <span className="font-mono text-xs">{lastUpdate}</span>
              </div>
            )}
            
            <Separator />
            
            {/* Cache Info */}
            {cacheStatus && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Service Worker:</span>
                  <Badge variant={cacheStatus.serviceWorkerRegistered ? "default" : "destructive"} className="text-xs">
                    {cacheStatus.serviceWorkerRegistered ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Caches:</span>
                  <span className="font-mono text-xs">{cacheStatus.cacheNames.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Armazenamento:</span>
                  <span className="font-mono text-xs">{formatBytes(cacheStatus.storageUsed)}</span>
                </div>
              </>
            )}
            
            <Separator />
            
            {/* Ações */}
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs" 
                onClick={handleForceUpdate}
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Forçar Atualização
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs" 
                onClick={() => {
                  navigator.clipboard.writeText(`Soccer Squad v${version} - ${buildTime || new Date().toISOString()}`);
                }}
              >
                <Database className="h-3 w-3 mr-2" />
                Copiar Info de Debug
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}