import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Trophy, 
  Target,
  Clock,
  MapPin,
  Medal,
  CheckCircle,
  TrendingUp,
  Users,
  Plus,
  Bell
} from "lucide-react";
import soccerFieldHero from "@/assets/soccer-field-hero.jpg";
import { AdBanner } from "@/components/AdBanner";
import { AuditLogs } from "@/components/AuditLogs";
import { AttendanceStats } from "./AttendanceStats";
import { GameNotifications } from "./GameNotifications";
import { useTeams } from "@/hooks/useTeams";
import { PermissionGate } from "./PermissionGate";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TeamSearch } from "@/components/TeamSearch";
import { useRealtime, useRealtimeNotifications } from "@/hooks/useRealtime";
import { PlayerRequestsManager } from "@/components/PlayerRequestsManager";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Dashboard() {
  const { activeTeam, teams, isTeamAdmin, getUserRole } = useTeams();
  const { user } = useAuth();
  const { toast } = useToast();
  const userRole = activeTeam ? getUserRole(activeTeam.id) : null;
  const [loading, setLoading] = useState(true);
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [nextGame, setNextGame] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [showRequests, setShowRequests] = useState(false);

  // Enable realtime notifications for this team (consolidated listener)
  useRealtimeNotifications(activeTeam?.id);

  // Listen for game_participants changes to update check-in status
  useRealtime({
    table: 'game_participants',
    enabled: !!activeTeam?.id && !!playerProfile,
    onEvent: (event: any) => {
      console.log('[Dashboard] Game participant event:', event);
      // Refresh next game when someone checks in
      if (event.eventType === 'INSERT' || event.eventType === 'UPDATE') {
        fetchNextGame();
      }
    }
  });

  useEffect(() => {
    if (activeTeam && user) {
      fetchDashboardData();
      if (isTeamAdmin(activeTeam.id)) {
        fetchPendingRequestsCount();
      }
    }
  }, [activeTeam, user]);

  const fetchPendingRequestsCount = async () => {
    if (!activeTeam?.id) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_pending_player_requests', { _team_id: activeTeam.id });
      
      if (!error && data) {
        setPendingRequests(data.length);
      }
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
    }
  };

  // Se não tem time ativo, mostra versão limitada do dashboard
  if (!activeTeam || teams.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Bem-vindo ao Sistema de Futebol!</h1>
          <p className="text-muted-foreground">
            Você ainda não faz parte de nenhum time. Procure por times disponíveis ou aguarde um convite.
          </p>
          <TeamSearch />
        </div>

        {/* Funcionalidades limitadas para usuários sem time */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rankings</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Disponível</div>
              <p className="text-xs text-muted-foreground">
                Veja rankings gerais de jogadores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jogos Públicos</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Em Breve</div>
              <p className="text-xs text-muted-foreground">
                Participe de jogos públicos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perfil</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Configurar</div>
              <p className="text-xs text-muted-foreground">
                Configure seu perfil pessoal
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Buscar perfil do jogador
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        // Buscar dados do jogador se existir no time
        const { data: player } = await supabase
          .from('players')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('team_id', activeTeam.id)
          .maybeSingle();

        setPlayerProfile(player);

        if (player) {
          // Buscar estatísticas e jogos apenas se o jogador existir
          await Promise.all([
            fetchPlayerStats(player),
            fetchRecentGames(),
            fetchNextGame()
          ]);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerStats = async (player: any) => {
    try {
      // Buscar estatísticas reais do jogador
      const { data: stats } = await supabase
        .from('player_statistics')
        .select('*')
        .eq('player_id', player.id)
        .eq('team_id', activeTeam.id)
        .maybeSingle();

      // Buscar estatísticas de presença
      const { data: attendanceData } = await supabase
        .rpc('get_player_attendance_stats', {
          _player_id: player.id,
          _team_id: activeTeam.id
        })
        .maybeSingle();

      setPlayerStats({
        goals: stats?.goals || 0,
        assists: stats?.assists || 0,
        gamesPlayed: stats?.games_played || 0,
        ranking: null,
        attendanceRate: Math.round(attendanceData?.attendance_percentage || 0)
      });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      setPlayerStats({
        goals: 0,
        assists: 0,
        gamesPlayed: 0,
        ranking: null,
        attendanceRate: 0
      });
    }
  };

  const fetchRecentGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('team_id', activeTeam.id)
      .in('status', ['finished', 'not_realized'])
      .order('date', { ascending: false })
      .limit(3);

    setRecentGames(data || []);
  };

  const fetchNextGame = async () => {
    if (!playerProfile) return;

    const { data } = await supabase
      .from('games')
      .select('*, game_participants!inner(player_id, status)')
      .eq('team_id', activeTeam.id)
      .in('status', ['scheduled', 'checkin'])
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (data) {
      // Check if current player has checked in
      const playerParticipant = data.game_participants?.find(
        (p: any) => p.player_id === playerProfile.id
      );
      
      setNextGame({
        ...data,
        userCheckedIn: playerParticipant?.status === 'confirmed',
        participantExists: !!playerParticipant
      });
    } else {
      setNextGame(null);
    }
  };

  const handleCheckIn = async (gameId: string) => {
    if (!playerProfile || !activeTeam) return;

    try {
      // Check if participant record exists
      const { data: existingParticipant } = await supabase
        .from('game_participants')
        .select('*')
        .eq('game_id', gameId)
        .eq('player_id', playerProfile.id)
        .maybeSingle();

      if (existingParticipant) {
        // Update existing participant
        const { error } = await supabase
          .from('game_participants')
          .update({
            status: 'confirmed',
            checked_in_at: new Date().toISOString()
          })
          .eq('game_id', gameId)
          .eq('player_id', playerProfile.id);

        if (error) throw error;
      } else {
        // Get profile for the check-in
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) throw new Error('Profile not found');

        // Create new participant
        const { error } = await supabase
          .from('game_participants')
          .insert({
            game_id: gameId,
            player_id: playerProfile.id,
            profile_id: profile.id,
            status: 'confirmed',
            checked_in_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Refresh game data
      await fetchNextGame();
      
      toast({
        title: "✅ Check-in realizado!",
        description: "Sua presença foi confirmada no jogo."
      });
    } catch (error: any) {
      console.error('Error checking in:', error);
      toast({
        title: "Erro no check-in",
        description: error.message || "Não foi possível confirmar sua presença.",
        variant: "destructive"
      });
    }
  };

  const getResultIcon = (result: string) => {
    const baseClasses = "w-3 h-3 rounded-full";
    switch(result) {
      case "V": return <div className={`${baseClasses} bg-green-500`} />;
      case "D": return <div className={`${baseClasses} bg-red-500`} />;
      case "E": return <div className={`${baseClasses} bg-yellow-500`} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="relative overflow-hidden">
          <div className="h-32 bg-muted" />
          <CardContent className="relative -mt-8 pb-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Se o usuário não está associado a um jogador no time
  if (!playerProfile) {
    return (
      <div className="space-y-6">
        <Card className="relative overflow-hidden">
        <div 
          className="h-32 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${soccerFieldHero})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
          </div>
          <CardContent className="relative -mt-8 pb-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-16 h-16 border-4 border-background">
                <AvatarFallback className="text-lg font-bold">
                  <Users className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">Bem-vindo ao Time!</h1>
                <p className="text-muted-foreground">Você ainda não está registrado como jogador</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="dark" className="backdrop-blur-md">
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-primary mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Nenhum perfil de jogador encontrado</h3>
            <p className="text-white/70 mb-4">
              Para ver suas estatísticas, você precisa ser adicionado como jogador pelo administrador do time.
            </p>
            <Badge variant="outline" className="border-primary/50 text-white">
              Entre em contato com o administrador
            </Badge>
          </CardContent>
        </Card>

        {/* Admin Controls */}
        {activeTeam && isTeamAdmin(activeTeam.id) && (
          <div className="space-y-4">
            {/* Pending Requests Alert */}
            {pendingRequests > 0 && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-900">
                          {pendingRequests} nova(s) solicitação(ões) de jogador
                        </p>
                        <p className="text-sm text-orange-700">
                          Clique para revisar e aprovar/rejeitar
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowRequests(!showRequests)}
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      {showRequests ? 'Ocultar' : 'Ver Solicitações'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Player Requests Manager */}
            {showRequests && <PlayerRequestsManager />}
            
            {/* Audit Logs */}
            <AuditLogs teamId={activeTeam.id} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Player Profile Section */}
      <Card className="relative overflow-hidden">
        <div 
          className="h-32 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${soccerFieldHero})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <CardContent className="relative -mt-8 pb-6">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <Avatar className="w-16 h-16 border-4 border-background mx-auto">
                <AvatarImage src={playerProfile.profile_image} alt={playerProfile.name} />
                <AvatarFallback className="text-lg font-bold">
                  {playerProfile.jersey_number || playerProfile.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {playerProfile.jersey_number && (
                <Badge variant="outline" className="mt-1 font-bold text-xs">
                  #{playerProfile.jersey_number}
                </Badge>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{playerProfile.name}</h1>
              <p className="text-muted-foreground">"{playerProfile.nickname}" • {playerProfile.position}</p>
              {playerProfile.email && (
                <p className="text-sm text-muted-foreground">{playerProfile.email}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="smooth-transition hover:team-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{playerStats?.gamesPlayed || 0}</p>
                <p className="text-xs text-muted-foreground">Jogos no Ano</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="smooth-transition hover:team-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-muted text-teamA">
                <Medal className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{playerStats?.ranking || "-"}</p>
                <p className="text-xs text-muted-foreground">Posição Ranking</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="smooth-transition hover:team-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-muted text-success">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{playerStats?.attendanceRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Taxa Check-in</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="smooth-transition hover:team-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-muted text-primary">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{playerStats?.goals || 0}</p>
                <p className="text-xs text-muted-foreground">Gols</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Games Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Próximos Jogos</h3>
        {nextGame ? (
          <Card className="hero-gradient text-primary-foreground">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{nextGame.title}</span>
                {nextGame.userCheckedIn ? (
                  <Badge className="bg-accent text-white border-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Check-in Confirmado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    Check-in Disponível
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{new Date(nextGame.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{nextGame.time}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{nextGame.location}</span>
              </div>
              {nextGame.description && (
                <p className="text-sm opacity-90">{nextGame.description}</p>
              )}
              
              {/* Check-in Button */}
              {nextGame.userCheckedIn ? (
                <div className="bg-accent/20 border-2 border-accent rounded-lg p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="font-semibold">Presença Confirmada!</p>
                  <p className="text-xs opacity-80 mt-1">Você já fez check-in neste jogo</p>
                </div>
              ) : (
                <Button 
                  onClick={() => handleCheckIn(nextGame.id)}
                  className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Fazer Check-in Agora
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum jogo agendado</h3>
              <p className="text-muted-foreground">
                Aguarde o próximo jogo ser marcado pelo administrador
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Games */}
      <Card>
        <CardHeader>
          <CardTitle>Jogos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentGames.length > 0 ? (
            <div className="space-y-3">
              {recentGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    {game.status === 'finished' && getResultIcon("V")}
                    <div>
                      <p className="font-medium text-sm">{game.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(game.date).toLocaleDateString('pt-BR')} • {game.location}
                      </p>
                      {game.status === 'finished' && game.home_score !== null && game.away_score !== null && (
                        <p className="text-xs text-accent font-bold mt-1">
                          {game.home_score} x {game.away_score}
                        </p>
                      )}
                    </div>
                  </div>
                  {game.status === 'finished' ? (
                    <Badge variant="outline" className="border-success/50 text-success">
                      Finalizado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-gray-500 text-gray-400">
                      Não Realizado
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum jogo recente encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Notifications Section */}
      <GameNotifications />

      {/* Admin Controls */}
      {activeTeam && isTeamAdmin(activeTeam.id) && (
        <div className="space-y-4">
          {/* Pending Requests Alert */}
          {pendingRequests > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-900">
                        {pendingRequests} nova(s) solicitação(ões) de jogador
                      </p>
                      <p className="text-sm text-orange-700">
                        Clique para revisar e aprovar/rejeitar
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowRequests(!showRequests)}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    {showRequests ? 'Ocultar' : 'Ver Solicitações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Player Requests Manager */}
          {showRequests && <PlayerRequestsManager />}

          {/* In-app advertising banner */}
          <AdBanner target="dashboard" />

          {/* Audit Logs */}
          <AuditLogs teamId={activeTeam.id} />
        </div>
      )}
    </div>
  );
}