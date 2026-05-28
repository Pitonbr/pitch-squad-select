import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  Target, 
  Heart, 
  Shield, 
  Zap, 
  AlertTriangle,
  Crown,
  Medal,
  Award,
  Calendar,
  TrendingUp,
  Users
} from "lucide-react";
import { useTeams } from "@/hooks/useTeams";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { getInitialsAvatar } from "@/lib/avatar";

interface PlayerRanking {
  id: string;
  name: string;
  nickname: string;
  position: string;
  value: number;
  profile_image?: string;
}

interface CoachRanking {
  id: string;
  name: string;
  wins: number;
  draws: number;
  losses: number;
  points: number; // wins * 3 + draws * 1
}

export function Rankings() {
  const [activeTab, setActiveTab] = useState("stats");
  const [loading, setLoading] = useState(true);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const { activeTeam } = useTeams();

  useEffect(() => {
    if (activeTeam) {
      fetchRankingsData();
    }
  }, [activeTeam]);

  // Realtime listeners
  const handleDataUpdate = useCallback(() => {
    fetchRankingsData();
  }, [activeTeam]);

  // Listen to games table changes (for recent games)
  useRealtime({
    table: 'games',
    filter: activeTeam?.id ? `team_id=eq.${activeTeam.id}` : undefined,
    enabled: !!activeTeam?.id,
    onEvent: handleDataUpdate
  });

  // Listen to player_statistics table changes
  useRealtime({
    table: 'player_statistics',
    filter: activeTeam?.id ? `team_id=eq.${activeTeam.id}` : undefined,
    enabled: !!activeTeam?.id,
    onEvent: handleDataUpdate
  });

  // Listen to match_events table changes (affects player stats)
  useRealtime({
    table: 'match_events',
    enabled: !!activeTeam?.id,
    onEvent: handleDataUpdate
  });

  const fetchRankingsData = async () => {
    try {
      setLoading(true);
      
      // Buscar jogos recentes e não realizados do time
      const { data: games } = await supabase
        .from('games')
        .select('*')
        .eq('team_id', activeTeam.id)
        .in('status', ['finished', 'not_realized'])
        .order('date', { ascending: false })
        .limit(10);

      setRecentGames(games || []);

      // Buscar jogadores e todas as estatísticas em paralelo (evita N+1 queries)
      const [{ data: teamPlayers }, { data: allStats }] = await Promise.all([
        supabase.rpc('get_team_players', { _team_id: activeTeam.id }),
        supabase
          .from('player_statistics')
          .select('*')
          .eq('team_id', activeTeam.id),
      ]);

      if (teamPlayers && teamPlayers.length > 0) {
        const statsById = Object.fromEntries(
          (allStats || []).map((s: any) => [s.player_id, s])
        );
        const playersWithStats = teamPlayers.map((player: any) => ({
          ...player,
          stats: statsById[player.id] || {
            goals: 0,
            assists: 0,
            yellow_cards: 0,
            red_cards: 0,
            games_played: 0,
          },
        }));
        setPlayers(playersWithStats);
      } else {
        setPlayers([]);
      }
      
    } catch (error) {
      console.error('Error fetching rankings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankingIcon = (position: number) => {
    if (position === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{position}</span>;
  };

  const getRankingBadgeColor = (position: number) => {
    if (position <= 3) return "field-gradient text-white";
    if (position <= 5) return "bg-secondary text-secondary-foreground";
    return "bg-muted text-muted-foreground";
  };

  const PlayerRankingCard = ({ 
    players, 
    title, 
    icon: Icon, 
    valueLabel 
  }: { 
    players: PlayerRanking[]; 
    title: string; 
    icon: any; 
    valueLabel: string;
  }) => (
    <Card variant="dark" className="backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-white">
          <Icon className="h-5 w-5 text-primary" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {players.map((player, index) => (
          <div key={player.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 smooth-transition border border-primary/20">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center">
                {getRankingIcon(index + 1)}
              </div>
                      <Avatar className="h-8 w-8 ring-2 ring-primary/30">
                        <AvatarImage src={player.profile_image} alt={player.name} />
                        <AvatarFallback className="text-xs bg-primary/20 text-white">
                          {player.nickname.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
              <div>
                <p className="font-semibold text-sm text-white">{player.nickname}</p>
                <p className="text-xs text-white/60">{player.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs border-accent text-accent">
                {player.position}
              </Badge>
              <Badge className={getRankingBadgeColor(index + 1)}>
                {player.value} {valueLabel}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Rankings e Estatísticas</h2>
        <p className="text-white/90">
          Estatísticas completas, rankings e histórico de jogos
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-primary/30">
          <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-white">Estatísticas dos Jogadores</TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-primary data-[state=active]:text-white">Jogos Recentes</TabsTrigger>
        </TabsList>

        {/* Player Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          {players.length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card variant="dark" className="backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Jogadores do Time</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {players.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 smooth-transition border border-primary/20">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center">
                          <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-white/70">
                            #{index + 1}
                          </span>
                        </div>
                        <Avatar className="h-8 w-8 ring-2 ring-primary/30">
                          <AvatarImage src={player.profile_image || getInitialsAvatar(player.name)} alt={player.name} />
                          <AvatarFallback className="text-xs bg-primary/20 text-white">
                            {player.nickname.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm text-white">{player.nickname}</p>
                          <p className="text-xs text-white/85">{player.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs border-accent text-accent">
                          {player.position}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Scorers */}
              {players.some((p: any) => p.stats?.goals > 0) && (
                <Card variant="dark" className="backdrop-blur-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Target className="h-5 w-5 text-primary" />
                      <span>Artilheiros</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {players
                      .filter((p: any) => p.stats?.goals > 0)
                      .sort((a: any, b: any) => (b.stats?.goals || 0) - (a.stats?.goals || 0))
                      .slice(0, 5)
                      .map((player: any, index: number) => (
                        <div key={player.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 smooth-transition border border-primary/20">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center">
                              {getRankingIcon(index + 1)}
                            </div>
                            <Avatar className="h-8 w-8 ring-2 ring-primary/30">
                              <AvatarImage src={player.profile_image} alt={player.name} />
                              <AvatarFallback className="text-xs bg-primary/20 text-white">
                                {player.nickname.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm text-white">{player.nickname}</p>
                              <p className="text-xs text-white/60">{player.name}</p>
                            </div>
                          </div>
                          <Badge className={getRankingBadgeColor(index + 1)}>
                            {player.stats?.goals || 0} gols
                          </Badge>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}

              {/* Statistics placeholder if no data */}
              {!players.some((p: any) => p.stats?.goals > 0) && (
                <Card variant="dark" className="backdrop-blur-md">
                  <CardContent className="text-center py-12">
                    <Trophy className="h-16 w-16 mx-auto text-primary mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-white">Aguardando Jogos</h3>
                    <p className="text-white/90">
                      As estatísticas aparecerão aqui após os primeiros jogos finalizados.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card variant="dark" className="backdrop-blur-md">
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">Nenhum jogador encontrado</h3>
                <p className="text-white/90">
                  Adicione jogadores ao time para ver as estatísticas aqui.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recent Games Tab */}
        <TabsContent value="recent" className="space-y-6">
          {recentGames.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Performance Summary */}
              <Card className="bg-gradient-to-br from-primary to-accent text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Histórico do Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm opacity-90">Jogos realizados</p>
                      <p className="text-3xl font-bold">{recentGames.length}</p>
                    </div>
                    <div className="text-sm">
                      <div>Status dos jogos finalizados</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Games List */}
              <div className="lg:col-span-2">
                <Card variant="dark" className="backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Calendar className="h-5 w-5 text-primary" />
                      Histórico de Jogos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentGames.map((game, index) => (
                        <div key={game.id} className="flex items-center justify-between p-3 border border-primary/30 rounded-lg hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-8 text-center border-accent text-accent">
                              {index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium text-sm text-white">{game.title}</p>
                              <p className="text-xs text-white/85">
                                {new Date(game.date).toLocaleDateString('pt-BR')} • {game.location}
                              </p>
                              {game.status === 'finished' && game.home_score !== null && game.away_score !== null && (
                                <p className="text-xs text-accent font-bold mt-1">
                                  Placar: {game.home_score} x {game.away_score}
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
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card variant="dark" className="backdrop-blur-md">
              <CardContent className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">Nenhum jogo encontrado</h3>
                <p className="text-white/90">
                  Quando jogos forem realizados, o histórico aparecerá aqui.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}