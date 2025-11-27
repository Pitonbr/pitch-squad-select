import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useOfflineQueue } from '@/contexts/OfflineQueueContext';

export function OfflineIndicator() {
  const { isOnline, queuedCount, conflictCount, isSyncing, syncQueue } = useOfflineQueue();

  if (isOnline && queuedCount === 0 && conflictCount === 0) {
    return null; // Don't show indicator when online and no pending actions or conflicts
  }

  return (
    <div className="flex items-center space-x-2">
      {!isOnline && (
        <Badge variant="destructive" className="flex items-center space-x-1 text-xs">
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </Badge>
      )}
      
      {queuedCount > 0 && (
        <Badge 
          variant={isOnline ? "default" : "secondary"} 
          className="flex items-center space-x-1 text-xs"
        >
          <CloudOff className="h-3 w-3" />
          <span>{queuedCount} {queuedCount === 1 ? 'ação pendente' : 'ações pendentes'}</span>
        </Badge>
      )}

      {conflictCount > 0 && (
        <Badge 
          variant="destructive" 
          className="flex items-center space-x-1 text-xs animate-pulse"
        >
          <AlertTriangle className="h-3 w-3" />
          <span>{conflictCount} {conflictCount === 1 ? 'conflito' : 'conflitos'}</span>
        </Badge>
      )}

      {isOnline && queuedCount > 0 && !isSyncing && (
        <Button
          size="sm"
          variant="outline"
          onClick={syncQueue}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Sincronizar
        </Button>
      )}

      {isSyncing && (
        <Badge variant="secondary" className="flex items-center space-x-1 text-xs">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Sincronizando...</span>
        </Badge>
      )}
    </div>
  );
}
