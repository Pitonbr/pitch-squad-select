import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSubscription {
  table: string;
  filter?: string;
  callbacks: Set<(payload: any) => void>;
  channel: RealtimeChannel | null;
  retryCount: number;
}

interface RealtimeContextType {
  subscribe: (table: string, filter: string | undefined, callback: (payload: any) => void) => () => void;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionsRef = useRef<Map<string, RealtimeSubscription>>(new Map());
  const connectionCheckRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create connection monitor
    const monitorChannel = supabase
      .channel('connection-monitor')
      .subscribe((status) => {
        console.log('[RealtimeProvider] Connection status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    connectionCheckRef.current = monitorChannel;

    return () => {
      console.log('[RealtimeProvider] Cleaning up all subscriptions');
      subscriptionsRef.current.forEach((sub) => {
        if (sub.channel) {
          supabase.removeChannel(sub.channel);
        }
      });
      subscriptionsRef.current.clear();
      
      if (connectionCheckRef.current) {
        supabase.removeChannel(connectionCheckRef.current);
      }
    };
  }, []);

  const subscribe = (
    table: string,
    filter: string | undefined,
    callback: (payload: any) => void
  ) => {
    const key = `${table}-${filter || 'all'}`;
    
    let subscription = subscriptionsRef.current.get(key);

    if (!subscription) {
      console.log(`[RealtimeProvider] Creating new subscription for ${key}`);
      
      subscription = {
        table,
        filter,
        callbacks: new Set(),
        channel: null,
        retryCount: 0,
      };
      
      subscriptionsRef.current.set(key, subscription);
      
      // Create channel with retry logic
      const createChannel = () => {
        const channelName = `realtime-${key}`;
        
        const channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: table,
              ...(filter && { filter }),
            },
            (payload) => {
              console.log(`[RealtimeProvider] Event received for ${key}:`, payload.eventType);
              subscription!.callbacks.forEach((cb) => cb(payload));
            }
          )
          .subscribe((status) => {
            console.log(`[RealtimeProvider] ${channelName} status:`, status);
            
            if (status === 'SUBSCRIBED') {
              subscription!.retryCount = 0;
            } else if (status === 'CHANNEL_ERROR' && subscription!.retryCount < 3) {
              console.warn(`[RealtimeProvider] Retrying ${key} (attempt ${subscription!.retryCount + 1})`);
              subscription!.retryCount++;
              
              // Exponential backoff: 1s, 2s, 4s
              const delay = Math.pow(2, subscription!.retryCount) * 1000;
              setTimeout(() => {
                if (subscription!.channel) {
                  supabase.removeChannel(subscription!.channel);
                }
                createChannel();
              }, delay);
            }
          });

        subscription!.channel = channel;
      };

      createChannel();
    }

    // Add callback
    subscription.callbacks.add(callback);
    console.log(`[RealtimeProvider] Added callback to ${key} (total: ${subscription.callbacks.size})`);

    // Return unsubscribe function
    return () => {
      const sub = subscriptionsRef.current.get(key);
      if (sub) {
        sub.callbacks.delete(callback);
        console.log(`[RealtimeProvider] Removed callback from ${key} (remaining: ${sub.callbacks.size})`);
        
        // If no more callbacks, clean up channel
        if (sub.callbacks.size === 0) {
          console.log(`[RealtimeProvider] Removing channel ${key}`);
          if (sub.channel) {
            supabase.removeChannel(sub.channel);
          }
          subscriptionsRef.current.delete(key);
        }
      }
    };
  };

  return (
    <RealtimeContext.Provider value={{ subscribe, isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within RealtimeProvider');
  }
  return context;
}
