import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSaveOptions<T> {
  data: T;
  saveFunction: (data: T) => Promise<void>;
  interval?: number; // milliseconds
  enabled?: boolean;
  debounceMs?: number;
}

export function useAutoSave<T>({
  data,
  saveFunction,
  interval = 1000, // Save every second as requested
  enabled = true,
  debounceMs = 500
}: UseAutoSaveOptions<T>) {
  const { toast } = useToast();
  const lastSavedRef = useRef<T>(data);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);

  const hasChanges = useCallback(() => {
    return JSON.stringify(data) !== JSON.stringify(lastSavedRef.current);
  }, [data]);

  const save = useCallback(async () => {
    if (!enabled || isSavingRef.current || !hasChanges()) {
      return;
    }

    try {
      isSavingRef.current = true;
      console.log('[AutoSave] Saving data...', data);
      
      await saveFunction(data);
      lastSavedRef.current = JSON.parse(JSON.stringify(data));
      
      console.log('[AutoSave] Data saved successfully');
    } catch (error: any) {
      console.error('[AutoSave] Error saving data:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Falha ao salvar automaticamente. Suas alterações podem ser perdidas.",
        variant: "destructive"
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [data, saveFunction, enabled, hasChanges, toast]);

  // Debounced save on data change
  useEffect(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (hasChanges()) {
        save();
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, save, debounceMs, enabled, hasChanges]);

  // Interval-based save every second
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      if (hasChanges()) {
        save();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [save, interval, enabled, hasChanges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    save: () => save(),
    hasUnsavedChanges: hasChanges(),
    isSaving: isSavingRef.current
  };
}