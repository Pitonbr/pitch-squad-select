import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface JoinRequestStatusProps {
  gameId?: string;
  teamId: string;
  onStatusChange?: (status: 'pending' | 'approved' | 'rejected' | null) => void;
}

export function JoinRequestStatus({ gameId, teamId, onStatusChange }: JoinRequestStatusProps) {
  const { profile } = useAuth();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameTitle, setGameTitle] = useState<string>("");

  useEffect(() => {
    if (profile) {
      checkRequestStatus();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel(`join_request_${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'team_join_requests',
            filter: `requesting_player_id=eq.${profile.id}`
          },
          (payload) => {
            const newStatus = payload.new.status as 'pending' | 'approved' | 'rejected';
            setStatus(newStatus);
            onStatusChange?.(newStatus);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile, teamId, gameId]);

  const checkRequestStatus = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('team_join_requests')
        .select('status, game_id, games(title)')
        .eq('team_id', teamId)
        .eq('requesting_player_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (gameId) {
        query = query.eq('game_id', gameId);
      }

      const { data } = await query.maybeSingle();

      if (data) {
        setStatus(data.status as 'pending' | 'approved' | 'rejected');
        if (data.games) {
          const games = data.games as any;
          if (Array.isArray(games) && games[0]) {
            setGameTitle(games[0].title);
          } else if (games.title) {
            setGameTitle(games.title);
          }
        }
        onStatusChange?.(data.status as 'pending' | 'approved' | 'rejected');
      } else {
        setStatus(null);
        onStatusChange?.(null);
      }
    } catch (error) {
      console.error('Error checking request status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card variant="dark" className="backdrop-blur-md">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-white/70">Verificando status...</p>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  return (
    <Card variant="dark" className="backdrop-blur-md border-primary/30">
      <CardContent className="p-6">
        {status === 'pending' && (
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-8 w-8 text-yellow-500 animate-pulse" />
              <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                Aguardando Aprovação
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-white font-semibold">
                Sua solicitação está aguardando aprovação do administrador
              </p>
              {gameTitle && (
                <p className="text-white/70 text-sm">
                  Jogo: <span className="text-primary font-medium">{gameTitle}</span>
                </p>
              )}
              <p className="text-white/60 text-sm">
                Você receberá um email quando o administrador processar sua solicitação.
              </p>
            </div>
          </div>
        )}

        {status === 'approved' && (
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-accent" />
              <Badge className="bg-accent/20 border-accent text-accent">
                Aprovado!
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-white font-semibold">
                Sua entrada no time foi aprovada!
              </p>
              {gameTitle && (
                <p className="text-white/70 text-sm">
                  Jogo: <span className="text-primary font-medium">{gameTitle}</span>
                </p>
              )}
              <p className="text-white/60 text-sm">
                Você já pode fazer check-in para o jogo. Recarregue a página.
              </p>
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <XCircle className="h-8 w-8 text-red-500" />
              <Badge variant="destructive">
                Solicitação Rejeitada
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-white font-semibold">
                Sua solicitação de entrada foi rejeitada
              </p>
              {gameTitle && (
                <p className="text-white/70 text-sm">
                  Jogo: <span className="text-primary font-medium">{gameTitle}</span>
                </p>
              )}
              <p className="text-white/60 text-sm">
                Entre em contato com o administrador do time para mais informações.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
