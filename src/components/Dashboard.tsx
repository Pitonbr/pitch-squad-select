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
import { AuditLogs } from "@/components/AuditLogs";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TeamSearch } from "@/components/TeamSearch";
import { useRealtime, useRealtimeNotifications } from "@/hooks/useRealtime";
import { PlayerRequestsManager } from "@/components/PlayerRequestsManager";

export function Dashboard() {
  const { activeTeam, teams, isTeamAdmin } = useTeams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [nextGame, setNextGame] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [showRequests, setShowRequests] = useState(false);

  // Enable realtime notifications for this team (consolidated listener)
  useRealtimeNotifications(activeTeam?.id);

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
    // Por enquanto retorna stats zeradas - implementar quando houver dados reais
    setPlayerStats({
      gamesPlayed: 0,
      ranking: null,
      checkInRate: 0,
      winRate: 0
    });
  };

  const fetchRecentGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('team_id', activeTeam.id)
      .eq('status', 'finished')
      .order('date', { ascending: false })
      .limit(3);

    setRecentGames(data || []);
  };

  const fetchNextGame = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('team_id', activeTeam.id)
      .eq('status', 'scheduled')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle();

    setNextGame(data);
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
                <p className="text-2xl font-bold">{playerStats?.checkInRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Taxa Check-in</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="smooth-transition hover:team-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-muted text-teamB">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{playerStats?.winRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Aproveitamento</p>
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
                <Badge variant="secondary" className="bg-white/20 text-white">
                  Em breve
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
              {recentGames.map((game, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-sm">{game.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(game.date).toLocaleDateString('pt-BR')} • {game.location}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {game.status}
                  </Badge>
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