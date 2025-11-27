import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { useRealtimeContext } from '@/contexts/RealtimeContext';

export function RealtimeIndicator() {
  const { isConnected } = useRealtimeContext();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (isConnected) {
      setLastUpdate(new Date());
    }

    // Update timestamp every 30 seconds if connected
    const interval = setInterval(() => {
      if (isConnected) {
        setLastUpdate(new Date());
      }
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [isConnected]);

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    return `${Math.floor(diff / 3600)}h atrás`;
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge 
        variant={isConnected ? "default" : "destructive"} 
        className="flex items-center space-x-1 text-xs"
      >
        {isConnected ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        <span>{isConnected ? 'Online' : 'Offline'}</span>
      </Badge>
      
      {lastUpdate && isConnected && (
        <Badge variant="outline" className="flex items-center space-x-1 text-xs">
          <Clock className="h-3 w-3" />
          <span>{formatLastUpdate(lastUpdate)}</span>
        </Badge>
      )}
    </div>
  );
}