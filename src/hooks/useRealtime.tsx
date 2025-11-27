import { useEffect, useRef, useCallback } from 'react';
import { useRealtimeContext } from '@/contexts/RealtimeContext';

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
  const { subscribe } = useRealtimeContext();
  const onEventRef = useRef(onEvent);

  // Keep onEvent ref updated
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || !onEventRef.current) return;

    const callback = (payload: any) => {
      const event: RealtimeEvent = {
        eventType: payload.eventType as RealtimeEventType,
        new: payload.new,
        old: payload.old,
        table: table
      };
      
      if (onEventRef.current) {
        onEventRef.current(event);
      }
    };

    const unsubscribe = subscribe(table, filter, callback);

    return () => {
      unsubscribe();
    };
  }, [table, filter, enabled, subscribe]);

  return {
    cleanup: () => {
      // Cleanup is handled by the provider
    }
  };
}

// Hook específico para notificações de mudanças importantes
export function useRealtimeNotifications(teamId?: string) {
  // Stabilize callbacks with useCallback to prevent re-subscriptions
  const handlePlayerRequest = useCallback((event: RealtimeEvent) => {
    if (event.eventType === 'INSERT' && event.new) {
      console.log('New player request:', event.new);
    }
  }, []);

  const handleTeamMember = useCallback((event: RealtimeEvent) => {
    if (event.eventType === 'INSERT' && event.new) {
      console.log('New team member:', event.new);
    }
  }, []);

  const handleGame = useCallback((event: RealtimeEvent) => {
    if (event.eventType === 'INSERT' && event.new) {
      console.log('New game created:', event.new);
    }
  }, []);

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