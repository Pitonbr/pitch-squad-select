import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface NotificationPreferences {
  game_status_changes: boolean;
  player_check_ins: boolean;
  new_games: boolean;
  game_reminders: boolean;
}

export function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe } = usePushNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    game_status_changes: true,
    player_check_ins: true,
    new_games: true,
    game_reminders: true
  });
  const [saving, setSaving] = useState(false);

  // Load notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          game_status_changes: data.game_status_changes,
          player_check_ins: data.player_check_ins,
          new_games: data.new_games,
          game_reminders: data.game_reminders
        });
      }
    };

    loadPreferences();
  }, [user]);

  const handleTogglePush = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user) return;

    setPreferences(prev => ({ ...prev, [key]: value }));
    setSaving(true);

    try {
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
        return;
      }

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          profile_id: profile.id,
          ...preferences,
          [key]: value
        }, {
          onConflict: 'profile_id'
        });

      if (error) {
        console.error('Error saving preferences:', error);
        toast({
          title: "Erro",
          description: "Falha ao salvar preferências",
          variant: "destructive"
        });
        // Revert the change
        setPreferences(prev => ({ ...prev, [key]: !value }));
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar preferências",
        variant: "destructive"
      });
      // Revert the change
      setPreferences(prev => ({ ...prev, [key]: !value }));
    } finally {
      setSaving(false);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notificações Push</CardTitle>
          <CardDescription>
            Seu navegador não suporta notificações push
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notificações Push</CardTitle>
          <CardDescription>
            Receba atualizações em tempo real sobre jogos e check-ins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {isSubscribed ? "Notificações Ativadas" : "Notificações Desativadas"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {permission === 'denied' 
                    ? "Você bloqueou as notificações. Ative nas configurações do navegador."
                    : isSubscribed
                    ? "Você receberá notificações sobre eventos importantes"
                    : "Ative para receber notificações em tempo real"}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleTogglePush} 
              disabled={loading || permission === 'denied'}
              variant={isSubscribed ? "destructive" : "default"}
            >
              {loading ? "Processando..." : isSubscribed ? "Desativar" : "Ativar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isSubscribed && (
        <Card>
          <CardHeader>
            <CardTitle>Preferências de Notificação</CardTitle>
            <CardDescription>
              Escolha quais notificações você deseja receber
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="game-status" className="flex flex-col gap-1">
                <span className="font-medium">Mudanças de Status de Jogos</span>
                <span className="text-sm text-muted-foreground">
                  Notificações quando o status de um jogo mudar
                </span>
              </Label>
              <Switch
                id="game-status"
                checked={preferences.game_status_changes}
                onCheckedChange={(checked) => handlePreferenceChange('game_status_changes', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="player-checkins" className="flex flex-col gap-1">
                <span className="font-medium">Check-ins de Jogadores</span>
                <span className="text-sm text-muted-foreground">
                  Notificações quando jogadores fizerem check-in
                </span>
              </Label>
              <Switch
                id="player-checkins"
                checked={preferences.player_check_ins}
                onCheckedChange={(checked) => handlePreferenceChange('player_check_ins', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="new-games" className="flex flex-col gap-1">
                <span className="font-medium">Novos Jogos</span>
                <span className="text-sm text-muted-foreground">
                  Notificações quando novos jogos forem criados
                </span>
              </Label>
              <Switch
                id="new-games"
                checked={preferences.new_games}
                onCheckedChange={(checked) => handlePreferenceChange('new_games', checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="game-reminders" className="flex flex-col gap-1">
                <span className="font-medium">Lembretes de Jogos</span>
                <span className="text-sm text-muted-foreground">
                  Notificações lembrando sobre jogos próximos
                </span>
              </Label>
              <Switch
                id="game-reminders"
                checked={preferences.game_reminders}
                onCheckedChange={(checked) => handlePreferenceChange('game_reminders', checked)}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
