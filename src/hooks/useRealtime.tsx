import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeEvent {
  eventType: RealtimeEventType;
  new?: any;
  old?: any;
  table: string;
}

interface UseRealtimeOptions {
  table: string;
  filter?: string;
  onEvent?: (event: RealtimeEvent) => void;
  enabled?: boolean;
}

export function useRealtime({ table, filter, onEvent, enabled = true }: UseRealtimeOptions) {
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const toastShownRef = useRef(false);
  const onEventRef = useRef(onEvent);

  // Keep onEvent ref updated without triggering re-subscription
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || !onEventRef.current) return;

    console.log(`[Realtime] Setting up listener for table: ${table}, filter: ${filter || 'none'}`);

    // Create unique channel name
    const channelName = `realtime-${table}-${filter || 'all'}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...(filter && { filter })
        },
        (payload) => {
          console.log(`[Realtime] Event received for ${table}:`, payload.eventType);
          
          const event: RealtimeEvent = {
            eventType: payload.eventType as RealtimeEventType,
            new: payload.new,
            old: payload.old,
            table: table
          };
          
          // Use ref to get latest callback without re-subscribing
          if (onEventRef.current) {
            onEventRef.current(event);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] ${channelName} subscription status:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Successfully subscribed to ${table} changes`);
          toastShownRef.current = false;
        } else if (status === 'CHANNEL_ERROR' && !toastShownRef.current) {
          console.error(`[Realtime] Error subscribing to ${table}`);
          toastShownRef.current = true;
          toast({
            title: "Erro de Conexão",
            description: "Falha ao conectar atualizações em tempo real",
            variant: "destructive"
          });
        }
      });

    channelRef.current = channel;

    return () => {
      console.log(`[Realtime] Cleaning up listener for ${table}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, filter, enabled, toast]);

  return {
    cleanup: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }
  };
}

// Hook específico para notificações de mudanças importantes
export function useRealtimeNotifications(teamId?: string) {
  const { toast } = useToast();

  // Stabilize callbacks with useCallback to prevent re-subscriptions
  const handlePlayerRequest = useCallback((event: RealtimeEvent) => {
    if (event.eventType === 'INSERT' && event.new) {
      toast({
        title: "Nova Solicitação de Jogador",
        description: `${event.new.name} solicitou entrar no time`,
      });
    }
  }, [toast]);

  const handleTeamMember = useCallback((event: RealtimeEvent) => {
    if (event.eventType === 'INSERT' && event.new) {
      toast({
        title: "Novo Membro no Time",
        description: "Um novo jogador foi adicionado ao time",
      });
    }
  }, [toast]);

  const handleGame = useCallback((event: RealtimeEvent) => {
    if (event.eventType === 'INSERT' && event.new) {
      toast({
        title: "Novo Jogo Criado",
        description: `${event.new.title} foi agendado`,
      });
    }
  }, [toast]);

  // Listen for player requests
  useRealtime({
    table: 'player_requests',
    filter: teamId ? `team_id=eq.${teamId}` : undefined,
    enabled: !!teamId,
    onEvent: handlePlayerRequest
  });

  // Listen for new team members
  useRealtime({
    table: 'team_members',
    filter: teamId ? `team_id=eq.${teamId}` : undefined,
    enabled: !!teamId,
    onEvent: handleTeamMember
  });

  // Listen for new games
  useRealtime({
    table: 'games',
    filter: teamId ? `team_id=eq.${teamId}` : undefined,
    enabled: !!teamId,
    onEvent: handleGame
  });
}