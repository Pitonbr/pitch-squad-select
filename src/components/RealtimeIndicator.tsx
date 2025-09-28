import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function RealtimeIndicator() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Create a test channel to monitor connection status
    const channel = supabase
      .channel('connection-test')
      .subscribe((status) => {
        console.log('[RealtimeIndicator] Connection status:', status);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setLastUpdate(new Date());
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
        }
      });

    // Update timestamp every 30 seconds if connected
    const interval = setInterval(() => {
      if (isConnected) {
        setLastUpdate(new Date());
      }
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

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