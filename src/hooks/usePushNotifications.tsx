import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const VAPID_PUBLIC_KEY = 'BNxSjCmvP_zXK5qY8KfF_Q3UYpWwN5xK5KpP_8CqY3LzX5P8YcKfF_QpWwN5xK5KpP_8CqY3LzX5P8YcKfF_Q'; // This should be configured in your project

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
      
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Check if user is already subscribed
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    checkSubscription();
  }, [isSupported]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPushNotifications = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta notificações push",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast({
          title: "Permissão negada",
          description: "Você precisa permitir notificações para receber atualizações",
          variant: "destructive"
        });
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado",
          variant: "destructive"
        });
        return false;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast({
          title: "Erro",
          description: "Perfil não encontrado",
          variant: "destructive"
        });
        return false;
      }

      // Save subscription to database
      const subscriptionData = subscription.toJSON() as PushSubscription;
      
      const insertData: any = {
        user_id: user.id,
        profile_id: profile.id,
        endpoint: subscriptionData.endpoint,
        subscription_data: subscriptionData
      };
      
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(insertData, {
          onConflict: 'profile_id,endpoint'
        });

      if (error) {
        console.error('Error saving subscription:', error);
        toast({
          title: "Erro",
          description: "Falha ao salvar subscrição",
          variant: "destructive"
        });
        return false;
      }

      setIsSubscribed(true);
      toast({
        title: "Notificações ativadas!",
        description: "Você receberá notificações sobre jogos e check-ins"
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: "Erro",
        description: "Falha ao ativar notificações",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, toast]);

  const unsubscribeFromPushNotifications = useCallback(async () => {
    if (!isSupported) return false;

    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const subscriptionData = subscription.toJSON() as PushSubscription;
          await supabase
            .from('push_subscriptions' as any)
            .delete()
            .eq('endpoint', subscriptionData.endpoint);
        }

        setIsSubscribed(false);
        toast({
          title: "Notificações desativadas",
          description: "Você não receberá mais notificações push"
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: "Erro",
        description: "Falha ao desativar notificações",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, toast]);

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe: subscribeToPushNotifications,
    unsubscribe: unsubscribeFromPushNotifications
  };
}
