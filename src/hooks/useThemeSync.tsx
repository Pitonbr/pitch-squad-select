import { useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * useThemeSync Hook
 * 
 * Sincroniza preferências de tema entre dispositivos via Supabase.
 * 
 * Features:
 * - Carrega tema do perfil no login
 * - Salva tema no Supabase com debounce (1s)
 * - Sincronização real-time via WebSocket
 * - Fallback para localStorage quando offline
 */
export function useThemeSync() {
  const { theme, setTheme } = useTheme();
  const { user, profile } = useAuth();
  const isInitialized = useRef(false);
  const isSyncing = useRef(false);

  // Carregar tema do perfil quando usuário faz login
  useEffect(() => {
    if (profile?.theme_preference && !isInitialized.current) {
      console.log('[ThemeSync] Loading theme from profile:', profile.theme_preference);
      setTheme(profile.theme_preference);
      isInitialized.current = true;
    }
  }, [profile, setTheme]);

  // Salvar tema no Supabase quando usuário altera (com debounce)
  const syncThemeToSupabase = useCallback(
    async (newTheme: string) => {
      if (!user || isSyncing.current) return;

      isSyncing.current = true;

      try {
        const { error } = await supabase
          .from('profiles')
          .update({ theme_preference: newTheme })
          .eq('user_id', user.id);

        if (error) {
          console.error('[ThemeSync] Error syncing theme:', error);
          toast.error('Erro ao sincronizar tema');
        } else {
          console.log('[ThemeSync] Theme synced successfully:', newTheme);
        }
      } catch (error) {
        console.error('[ThemeSync] Exception syncing theme:', error);
      } finally {
        isSyncing.current = false;
      }
    },
    [user]
  );

  // Observar mudanças de tema (com debounce de 1 segundo)
  useEffect(() => {
    if (!user || !isInitialized.current || !theme) return;

    const timeoutId = setTimeout(() => {
      syncThemeToSupabase(theme);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [theme, user, syncThemeToSupabase]);

  // Sincronização real-time
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile-theme-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newTheme = payload.new.theme_preference;
          if (newTheme && newTheme !== theme) {
            console.log('[ThemeSync] Theme updated from another device:', newTheme);
            setTheme(newTheme);
            toast.info('Tema atualizado em outro dispositivo');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, theme, setTheme]);
}
