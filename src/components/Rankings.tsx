import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TrendingUp
} from "lucide-react";

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

  // Recent games data
  const recentGames = [
    { id: 1, date: "2024-01-15", home: "Time Azul", away: "Time Vermelho", score: "3x2", points: 3 },
    { id: 2, date: "2024-01-12", home: "Time Verde", away: "Time Azul", score: "1x1", points: 1 },
    { id: 3, date: "2024-01-10", home: "Time Azul", away: "Time Amarelo", score: "2x0", points: 3 },
    { id: 4, date: "2024-01-08", home: "Time Roxo", away: "Time Azul", score: "0x1", points: 3 },
    { id: 5, date: "2024-01-05", home: "Time Azul", away: "Time Laranja", score: "2x2", points: 1 },
    { id: 6, date: "2024-01-03", home: "Time Branco", away: "Time Azul", score: "1x3", points: 3 },
    { id: 7, date: "2024-01-01", home: "Time Azul", away: "Time Preto", score: "0x2", points: 0 },
    { id: 8, date: "2023-12-29", home: "Time Rosa", away: "Time Azul", score: "1x1", points: 1 },
    { id: 9, date: "2023-12-27", home: "Time Azul", away: "Time Cinza", score: "4x1", points: 3 },
    { id: 10, date: "2023-12-24", home: "Time Marrom", away: "Time Azul", score: "0x1", points: 3 }
  ];

  const calculateEfficiency = (points: number, games: number) => {
    return games > 0 ? ((points / (games * 3)) * 100).toFixed(1) : "0.0";
  };

  const totalPoints = recentGames.reduce((sum, game) => sum + game.points, 0);
  const efficiency = calculateEfficiency(totalPoints, recentGames.length);

  // Mock data - in real app this would come from database
  const goalScorers: PlayerRanking[] = [
    { id: "1", name: "Carlos Silva", nickname: "Carlão", position: "Atacante", value: 15 },
    { id: "2", name: "Lucas Oliveira", nickname: "Lukão", position: "Atacante", value: 12 },
    { id: "3", name: "Pedro Santos", nickname: "Pedrinho", position: "Meio-campo", value: 8 },
    { id: "4", name: "Rafael Lima", nickname: "Rafa", position: "Atacante", value: 7 },
    { id: "5", name: "Diego Costa", nickname: "Diguinho", position: "Meio-campo", value: 6 },
    { id: "6", name: "Felipe Rocha", nickname: "Felipão", position: "Atacante", value: 5 },
    { id: "7", name: "Bruno Silva", nickname: "Brunão", position: "Meio-campo", value: 4 },
    { id: "8", name: "André Souza", nickname: "Dede", position: "Atacante", value: 3 },
    { id: "9", name: "Marcos Lima", nickname: "Marquinhos", position: "Meio-campo", value: 3 },
    { id: "10", name: "João Pedro", nickname: "JP", position: "Atacante", value: 2 }
  ];

  const assistProviders: PlayerRanking[] = [
    { id: "2", name: "Lucas Oliveira", nickname: "Lukão", position: "Atacante", value: 10 },
    { id: "3", name: "Pedro Santos", nickname: "Pedrinho", position: "Meio-campo", value: 9 },
    { id: "1", name: "Carlos Silva", nickname: "Carlão", position: "Atacante", value: 7 },
    { id: "5", name: "Diego Costa", nickname: "Diguinho", position: "Meio-campo", value: 6 },
    { id: "4", name: "Rafael Lima", nickname: "Rafa", position: "Atacante", value: 5 },
    { id: "7", name: "Bruno Silva", nickname: "Brunão", position: "Meio-campo", value: 4 },
    { id: "11", name: "Thiago Mendes", nickname: "Thiaguinho", position: "Lateral", value: 4 },
    { id: "8", name: "André Souza", nickname: "Dede", position: "Atacante", value: 3 },
    { id: "12", name: "Gabriel Reis", nickname: "Gabigol", position: "Meio-campo", value: 3 },
    { id: "9", name: "Marcos Lima", nickname: "Marquinhos", position: "Meio-campo", value: 2 }
  ];

  const bestDefenders: PlayerRanking[] = [
    { id: "13", name: "João Santos", nickname: "Joãozinho", position: "Goleiro", value: 25 },
    { id: "14", name: "Ricardo Alves", nickname: "Ricardinho", position: "Goleiro", value: 20 },
    { id: "15", name: "Mateus Silva", nickname: "Mateuzo", position: "Zagueiro", value: 18 },
    { id: "16", name: "Fernando Costa", nickname: "Fernandão", position: "Zagueiro", value: 15 },
    { id: "17", name: "Vinicius Lima", nickname: "Vini", position: "Zagueiro", value: 12 },
    { id: "18", name: "Leonardo Souza", nickname: "Léo", position: "Lateral", value: 10 },
    { id: "19", name: "Gustavo Reis", nickname: "Guga", position: "Zagueiro", value: 9 },
    { id: "20", name: "Alexandre Santos", nickname: "Alex", position: "Lateral", value: 8 },
    { id: "21", name: "Roberto Silva", nickname: "Betinho", position: "Zagueiro", value: 7 },
    { id: "22", name: "Caio Mendes", nickname: "Cainho", position: "Lateral", value: 6 }
  ];

  const bestTacklers: PlayerRanking[] = [
    { id: "15", name: "Mateus Silva", nickname: "Mateuzo", position: "Zagueiro", value: 45 },
    { id: "16", name: "Fernando Costa", nickname: "Fernandão", position: "Zagueiro", value: 40 },
    { id: "5", name: "Diego Costa", nickname: "Diguinho", position: "Meio-campo", value: 35 },
    { id: "17", name: "Vinicius Lima", nickname: "Vini", position: "Zagueiro", value: 32 },
    { id: "3", name: "Pedro Santos", nickname: "Pedrinho", position: "Meio-campo", value: 28 },
    { id: "18", name: "Leonardo Souza", nickname: "Léo", position: "Lateral", value: 25 },
    { id: "7", name: "Bruno Silva", nickname: "Brunão", position: "Meio-campo", value: 22 },
    { id: "19", name: "Gustavo Reis", nickname: "Guga", position: "Zagueiro", value: 20 },
    { id: "11", name: "Thiago Mendes", nickname: "Thiaguinho", position: "Lateral", value: 18 },
    { id: "20", name: "Alexandre Santos", nickname: "Alex", position: "Lateral", value: 15 }
  ];

  const coachRankings: CoachRanking[] = [
    { id: "1", name: "Técnico Silva", wins: 8, draws: 2, losses: 1, points: 26 },
    { id: "2", name: "Coach Santos", wins: 7, draws: 3, losses: 2, points: 24 },
    { id: "3", name: "Mestre Lima", wins: 6, draws: 4, losses: 2, points: 22 },
    { id: "4", name: "Professor Costa", wins: 5, draws: 3, losses: 3, points: 18 },
    { id: "5", name: "Técnico Oliveira", wins: 4, draws: 5, losses: 3, points: 17 },
    { id: "6", name: "Coach Mendes", wins: 4, draws: 2, losses: 5, points: 14 },
    { id: "7", name: "Mestre Rocha", wins: 3, draws: 4, losses: 4, points: 13 },
    { id: "8", name: "Professor Reis", wins: 3, draws: 3, losses: 5, points: 12 },
    { id: "9", name: "Técnico Alves", wins: 2, draws: 3, losses: 6, points: 9 },
    { id: "10", name: "Coach Souza", wins: 1, draws: 2, losses: 8, points: 5 }
  ];

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Top 10 Estatísticas</TabsTrigger>
          <TabsTrigger value="recent">Últimos 10 Jogos</TabsTrigger>
          <TabsTrigger value="coaches">Ranking Técnicos</TabsTrigger>
        </TabsList>

        {/* Player Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          {/* Player Rankings Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            <PlayerRankingCard
              players={goalScorers}
              title="Artilharia"
              icon={Target}
              valueLabel="gols"
            />
            
            <PlayerRankingCard
              players={assistProviders}
              title="Assistências"
              icon={Heart}
              valueLabel="assistências"
            />
            
            <PlayerRankingCard
              players={bestDefenders}
              title="Defesas Difíceis"
              icon={Shield}
              valueLabel="defesas"
            />
            
            <PlayerRankingCard
              players={bestTacklers}
              title="Desarmes"
              icon={Zap}
              valueLabel="desarmes"
            />
          </div>
        </TabsContent>

        {/* Recent Games Tab */}
        <TabsContent value="recent" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Summary */}
            <Card className="field-gradient text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Aproveitamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm opacity-90">Últimos 10 jogos</p>
                    <p className="text-3xl font-bold">{efficiency}%</p>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Pontos: {totalPoints}/30</div>
                    <div>Vitórias: {recentGames.filter(g => g.points === 3).length}</div>
                    <div>Empates: {recentGames.filter(g => g.points === 1).length}</div>
                    <div>Derrotas: {recentGames.filter(g => g.points === 0).length}</div>
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
                    Histórico dos Últimos 10 Jogos
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
                            <p className="font-medium text-sm">
                              {game.home} vs {game.away}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(game.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{game.score}</span>
                          <Badge variant={
                            game.points === 3 ? "default" : 
                            game.points === 1 ? "secondary" : "destructive"
                          }>
                            {game.points === 3 ? "V" : game.points === 1 ? "E" : "D"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {game.points}pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Coach Rankings Tab */}
        <TabsContent value="coaches" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-primary" />
                <span>Ranking de Técnicos</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Pontuação: Vitória = 3 pontos | Empate = 1 ponto | Derrota = 0 pontos
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {coachRankings.map((coach, index) => (
                <div key={coach.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 smooth-transition">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center">
                      {getRankingIcon(index + 1)}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm">
                        {coach.name.split(' ')[0].slice(0, 1)}{coach.name.split(' ')[1]?.slice(0, 1) || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{coach.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {coach.wins + coach.draws + coach.losses} jogos
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-success">{coach.wins}V</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-warning">{coach.draws}E</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-destructive">{coach.losses}D</p>
                    </div>
                    <Badge className={getRankingBadgeColor(index + 1)}>
                      {coach.points} pts
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}