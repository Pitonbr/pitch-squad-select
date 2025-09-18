import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface PlayerRanking {
  id: string;
  name: string;
  nickname: string;
  position: string;
  value: number;
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

  const fetchRankingsData = async () => {
    try {
      setLoading(true);
      
      // Buscar jogos recentes do time
      const { data: games } = await supabase
        .from('games')
        .select('*')
        .eq('team_id', activeTeam.id)
        .eq('status', 'finished')
        .order('date', { ascending: false })
        .limit(10);

      setRecentGames(games || []);

      // Buscar jogadores do time  
      const { data: teamPlayers } = await supabase
        .rpc('get_team_players', { _team_id: activeTeam.id });

      setPlayers(teamPlayers || []);
      
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-primary" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {players.map((player, index) => (
          <div key={player.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 smooth-transition">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center">
                {getRankingIcon(index + 1)}
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {player.nickname.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{player.nickname}</p>
                <p className="text-xs text-muted-foreground">{player.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
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
        <h2 className="text-2xl font-bold mb-2">Rankings e Estatísticas</h2>
        <p className="text-muted-foreground">
          Estatísticas completas, rankings e histórico de jogos
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stats">Estatísticas dos Jogadores</TabsTrigger>
          <TabsTrigger value="recent">Jogos Recentes</TabsTrigger>
        </TabsList>

        {/* Player Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          {players.length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Jogadores do Time</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {players.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 smooth-transition">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center">
                          <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
                            #{index + 1}
                          </span>
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {player.nickname.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{player.nickname}</p>
                          <p className="text-xs text-muted-foreground">{player.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {player.position}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="text-center py-12">
                  <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Estatísticas em Desenvolvimento</h3>
                  <p className="text-muted-foreground">
                    Rankings de gols, assistências e outras estatísticas serão exibidos aqui quando começarem os jogos.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum jogador encontrado</h3>
                <p className="text-muted-foreground">
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
              <Card className="field-gradient text-white">
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Histórico de Jogos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentGames.map((game, index) => (
                        <div key={game.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-8 text-center">
                              {index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium text-sm">{game.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(game.date).toLocaleDateString('pt-BR')} • {game.location}
                              </p>
                            </div>
                          </div>
                          
                          <Badge variant="outline">
                            {game.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum jogo encontrado</h3>
                <p className="text-muted-foreground">
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