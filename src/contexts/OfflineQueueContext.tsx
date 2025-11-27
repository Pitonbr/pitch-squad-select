import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineQueue, ConflictData } from '@/utils/offlineQueue';
import { useToast } from '@/hooks/use-toast';
import { useTeams } from '@/hooks/useTeams';
import { ConflictResolutionDialog } from '@/components/ConflictResolutionDialog';

interface OfflineQueueContextType {
  isOnline: boolean;
  queuedCount: number;
  conflictCount: number;
  isSyncing: boolean;
  enqueueAction: (type: 'insert' | 'update' | 'delete', table: string, data: any) => Promise<void>;
  syncQueue: () => Promise<void>;
}

const OfflineQueueContext = createContext<OfflineQueueContextType | undefined>(undefined);

export function OfflineQueueProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
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

  // Update queued count and conflict count
  const updateCounts = useCallback(async () => {
    const actionCount = await offlineQueue.getCount();
    const conflictCountValue = await offlineQueue.getConflictCount();
    setQueuedCount(actionCount);
    setConflictCount(conflictCountValue);
  }, []);

  useEffect(() => {
    updateCounts();
  }, [updateCounts]);

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
    await updateCounts();
    
    toast({
      title: "Ação Salva",
      description: "A ação será sincronizada quando a conexão for restaurada",
    });
  }, [activeTeam, isTeamAdmin, toast, updateCounts]);

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

          // For updates and deletes, check if record exists and has been modified
          if (action.type === 'update' || action.type === 'delete') {
            const { data: currentData, error: fetchError } = await supabase
              .from(action.table as any)
              .select('*')
              .eq('id', action.data.id)
              .maybeSingle();

            if (fetchError) {
              throw fetchError;
            }

            // Check for conflicts
            if (currentData) {
              // For updates, check if server data differs from local data
              if (action.type === 'update') {
                const hasConflict = Object.keys(action.data).some(
                  (key) => 
                    key !== 'id' && 
                    key !== 'updated_at' &&
                    JSON.stringify(currentData[key]) !== JSON.stringify(action.data[key])
                );

                if (hasConflict) {
                  console.warn('[OfflineQueue] Conflict detected for update:', action.id);
                  await offlineQueue.addConflict(
                    action.id,
                    action.data,
                    currentData,
                    action.table,
                    'update'
                  );
                  await offlineQueue.remove(action.id);
                  continue; // Skip this action, user will resolve conflict
                }
              }
              
              // For deletes, if record was modified, create conflict
              if (action.type === 'delete' && currentData) {
                const data: any = currentData; // Cast to any to bypass TypeScript narrowing issues
                if (
                  typeof data === 'object' && 
                  'updated_at' in data && 
                  data.updated_at
                ) {
                  const serverUpdateTime = new Date(data.updated_at).getTime();
                  const localActionTime = action.timestamp;
                  
                  if (serverUpdateTime > localActionTime) {
                    console.warn('[OfflineQueue] Conflict detected for delete:', action.id);
                    await offlineQueue.addConflict(
                      action.id,
                      action.data,
                      data,
                      action.table,
                      'delete'
                    );
                    await offlineQueue.remove(action.id);
                    continue; // Skip this action, user will resolve conflict
                  }
                }
              }
            } else if (action.type === 'update') {
              // Record doesn't exist, can't update
              console.error('[OfflineQueue] Cannot update non-existent record:', action.id);
              await offlineQueue.remove(action.id);
              failCount++;
              continue;
            }
          }

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

      // Check if there are any conflicts to resolve
      const allConflicts = await offlineQueue.getAllConflicts();
      if (allConflicts.length > 0) {
        setConflicts(allConflicts);
        setShowConflictDialog(true);
      }

      await updateCounts();

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
  }, [isOnline, isSyncing, activeTeam, toast, updateCounts]);

  // Handle conflict resolution
  const handleConflictResolve = useCallback(async (
    conflictId: string,
    resolution: 'keep-local' | 'keep-server'
  ) => {
    const conflict = conflicts.find((c) => c.id === conflictId);
    if (!conflict) return;

    try {
      if (resolution === 'keep-local') {
        // Apply local changes to server
        const result = conflict.type === 'update'
          ? await supabase
              .from(conflict.table as any)
              .update(conflict.localData)
              .eq('id', conflict.localData.id)
          : await supabase
              .from(conflict.table as any)
              .delete()
              .eq('id', conflict.localData.id);

        if (result?.error) {
          throw result.error;
        }

        toast({
          title: "Conflito Resolvido",
          description: "Suas alterações foram aplicadas",
        });
      } else {
        // Keep server version, discard local
        toast({
          title: "Conflito Resolvido",
          description: "A versão do servidor foi mantida",
        });
      }

      // Remove conflict from queue
      await offlineQueue.removeConflict(conflictId);
      await updateCounts();

      // Update local state
      setConflicts((prev) => prev.filter((c) => c.id !== conflictId));
    } catch (error) {
      console.error('[OfflineQueue] Failed to resolve conflict:', error);
      toast({
        title: "Erro",
        description: "Não foi possível resolver o conflito",
        variant: "destructive",
      });
    }
  }, [conflicts, toast, updateCounts]);

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
        conflictCount,
        isSyncing,
        enqueueAction,
        syncQueue,
      }}
    >
      {children}
      
      {showConflictDialog && conflicts.length > 0 && (
        <ConflictResolutionDialog
          conflicts={conflicts}
          onResolve={handleConflictResolve}
          onClose={() => {
            setShowConflictDialog(false);
            setConflicts([]);
          }}
        />
      )}
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
