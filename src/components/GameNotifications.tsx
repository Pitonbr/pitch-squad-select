import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTeams } from '@/hooks/useTeams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Trophy, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GameNotification {
  id: string;
  game_id: string;
  team_id: string;
  title: string;
  message: string;
  notification_type: string;
  metadata: any;
  created_at: string;
  is_read: boolean;
}

export function GameNotifications() {
  const { user } = useAuth();
  const { activeTeam } = useTeams();
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTeam || !user) return;

    fetchNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('game-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_notifications',
          filter: `team_id=eq.${activeTeam.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_reads'
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTeam?.id, user]);

  const fetchNotifications = async () => {
    if (!activeTeam || !user) return;

    try {
      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Fetch notifications with read status
      const { data: notificationsData, error } = await supabase
        .from('game_notifications')
        .select(`
          *,
          notification_reads!left(profile_id)
        `)
        .eq('team_id', activeTeam.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Map notifications and check if user has read them
      const mappedNotifications = notificationsData?.map((notif: any) => ({
        ...notif,
        is_read: notif.notification_reads?.some((read: any) => read.profile_id === profile.id) || false
      })) || [];

      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      await supabase
        .from('notification_reads')
        .insert({
          notification_id: notificationId,
          profile_id: profile.id
        });

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'game_finished':
        return <Trophy className="h-5 w-5 text-primary" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <Card className="bg-card/40 backdrop-blur border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="bg-card/40 backdrop-blur border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma notificação recente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/40 backdrop-blur border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`relative ${
                  notification.is_read
                    ? 'bg-card/20 border-border/20'
                    : 'bg-primary/5 border-primary/30'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm leading-tight">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {notification.message}
                      </p>
                      {notification.metadata && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {notification.metadata.finalScore && (
                            <Badge variant="outline" className="text-xs">
                              Placar: {notification.metadata.finalScore}
                            </Badge>
                          )}
                          {notification.metadata.topScorer && (
                            <Badge variant="outline" className="text-xs">
                              Artilheiro: {notification.metadata.topScorer}
                            </Badge>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
