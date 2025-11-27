import { useCallback } from 'react';
import { useOfflineQueue } from '@/contexts/OfflineQueueContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for performing database actions with offline queue support.
 * Only available for team admins.
 * 
 * When offline, actions are queued locally and synced when connection is restored.
 * When online, actions are performed immediately.
 */
export function useOfflineAction() {
  const { isOnline, enqueueAction } = useOfflineQueue();
  const { toast } = useToast();

  const performAction = useCallback(async <T = any>(
    type: 'insert' | 'update' | 'delete',
    table: string,
    data: any
  ): Promise<{ success: boolean; data?: T; error?: any }> => {
    if (!isOnline) {
      // Queue action for later sync
      await enqueueAction(type, table, data);
      return { success: true };
    }

    // Perform action immediately when online
    try {
      let result;
      switch (type) {
        case 'insert':
          result = await supabase.from(table as any).insert(data).select();
          break;
        case 'update':
          result = await supabase
            .from(table as any)
            .update(data)
            .eq('id', data.id)
            .select();
          break;
        case 'delete':
          result = await supabase
            .from(table as any)
            .delete()
            .eq('id', data.id);
          break;
      }

      if (result?.error) {
        throw result.error;
      }

      return { success: true, data: result?.data };
    } catch (error) {
      console.error('[OfflineAction] Failed to perform action:', error);
      toast({
        title: "Erro",
        description: "Não foi possível executar a ação",
        variant: "destructive",
      });
      return { success: false, error };
    }
  }, [isOnline, enqueueAction, toast]);

  return {
    performAction,
    isOnline,
  };
}
