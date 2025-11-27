import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineQueue } from '@/utils/offlineQueue';
import { useToast } from '@/hooks/use-toast';
import { useTeams } from '@/hooks/useTeams';

interface OfflineQueueContextType {
  isOnline: boolean;
  queuedCount: number;
  isSyncing: boolean;
  enqueueAction: (type: 'insert' | 'update' | 'delete', table: string, data: any) => Promise<void>;
  syncQueue: () => Promise<void>;
}

const OfflineQueueContext = createContext<OfflineQueueContextType | undefined>(undefined);

export function OfflineQueueProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const { activeTeam, isTeamAdmin } = useTeams();

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineQueue] Connection restored');
      setIsOnline(true);
      toast({
        title: "Conexão Restaurada",
        description: "Sincronizando ações pendentes...",
      });
      syncQueue();
    };

    const handleOffline = () => {
      console.log('[OfflineQueue] Connection lost');
      setIsOnline(false);
      toast({
        title: "Sem Conexão",
        description: "Suas ações serão salvas e sincronizadas quando voltar online",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Update queued count
  const updateQueuedCount = useCallback(async () => {
    const count = await offlineQueue.getCount();
    setQueuedCount(count);
  }, []);

  useEffect(() => {
    updateQueuedCount();
  }, [updateQueuedCount]);

  // Enqueue action (only for admins)
  const enqueueAction = useCallback(async (
    type: 'insert' | 'update' | 'delete',
    table: string,
    data: any
  ) => {
    if (!activeTeam || !isTeamAdmin) {
      console.warn('[OfflineQueue] Action rejected: user is not a team admin');
      return;
    }

    await offlineQueue.enqueue(type, table, data, activeTeam.id);
    await updateQueuedCount();
    
    toast({
      title: "Ação Salva",
      description: "A ação será sincronizada quando a conexão for restaurada",
    });
  }, [activeTeam, isTeamAdmin, toast, updateQueuedCount]);

  // Sync queue
  const syncQueue = useCallback(async () => {
    if (!isOnline || isSyncing || !activeTeam) return;

    setIsSyncing(true);
    console.log('[OfflineQueue] Starting sync...');

    try {
      const actions = await offlineQueue.getAllByTeam(activeTeam.id);
      console.log(`[OfflineQueue] Found ${actions.length} actions to sync`);

      let successCount = 0;
      let failCount = 0;

      for (const action of actions) {
        try {
          console.log(`[OfflineQueue] Syncing ${action.type} on ${action.table}`);

          let result;
          switch (action.type) {
            case 'insert':
              result = await supabase.from(action.table as any).insert(action.data);
              break;
            case 'update':
              result = await supabase
                .from(action.table as any)
                .update(action.data)
                .eq('id', action.data.id);
              break;
            case 'delete':
              result = await supabase
                .from(action.table as any)
                .delete()
                .eq('id', action.data.id);
              break;
          }

          if (result?.error) {
            throw result.error;
          }

          await offlineQueue.remove(action.id);
          successCount++;
        } catch (error) {
          console.error('[OfflineQueue] Failed to sync action:', error);
          
          // Increment retry count
          if (action.retries < 3) {
            await offlineQueue.updateRetries(action.id, action.retries + 1);
          } else {
            // Remove after 3 failed attempts
            await offlineQueue.remove(action.id);
            failCount++;
          }
        }
      }

      await updateQueuedCount();

      if (successCount > 0) {
        toast({
          title: "Sincronização Concluída",
          description: `${successCount} ${successCount === 1 ? 'ação sincronizada' : 'ações sincronizadas'} com sucesso`,
        });
      }

      if (failCount > 0) {
        toast({
          title: "Erro na Sincronização",
          description: `${failCount} ${failCount === 1 ? 'ação falhou' : 'ações falharam'}`,
          variant: "destructive",
        });
      }

      console.log('[OfflineQueue] Sync completed');
    } catch (error) {
      console.error('[OfflineQueue] Sync error:', error);
      toast({
        title: "Erro na Sincronização",
        description: "Não foi possível sincronizar as ações pendentes",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, activeTeam, toast, updateQueuedCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queuedCount > 0) {
      syncQueue();
    }
  }, [isOnline, queuedCount, syncQueue]);

  return (
    <OfflineQueueContext.Provider
      value={{
        isOnline,
        queuedCount,
        isSyncing,
        enqueueAction,
        syncQueue,
      }}
    >
      {children}
    </OfflineQueueContext.Provider>
  );
}

export function useOfflineQueue() {
  const context = useContext(OfflineQueueContext);
  if (!context) {
    throw new Error('useOfflineQueue must be used within OfflineQueueProvider');
  }
  return context;
}
