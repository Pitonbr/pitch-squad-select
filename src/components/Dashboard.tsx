import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Trophy, 
  Target,
  Clock,
  MapPin,
  Medal,
  CheckCircle,
  TrendingUp
} from "lucide-react";
import soccerFieldHero from "@/assets/soccer-field-hero.jpg";
import { AuditLogs } from "@/components/AuditLogs";
import { useTeams } from "@/hooks/useTeams";

export function Dashboard() {
  const { activeTeam, isTeamAdmin } = useTeams();
  
  // Mock data do jogador logado
  const player = {
    name: "João Silva",
    nickname: "Joãozinho",
    avatar: "/placeholder.svg",
    position: "Atacante"
  };

  const playerStats = [
    {
      title: "Jogos no Ano",
      value: "24",
      icon: Calendar,
      color: "text-primary"
    },
    {
      title: "Posição Ranking", 
      value: "3º",
      icon: Medal,
      color: "text-teamA"
    },
    {
      title: "Taxa Check-in",
      value: "92%",
      icon: CheckCircle,
      color: "text-success"
    },
    {
      title: "Aproveitamento",
      value: "68%",
      icon: TrendingUp,
      color: "text-teamB"
    }
  ];

  // Histórico dos últimos 5 jogos (V = vitória, D = derrota, E = empate)
  const lastGamesResults = ["V", "V", "D", "E", "V"];
  const winPercentage = Math.round((lastGamesResults.filter(r => r === "V").length / lastGamesResults.length) * 100);

  const recentGames = [
    {
      date: "2024-01-15",
      location: "Campo Central", 
      status: "Finalizado",
      score: "Time A 3x2 Time B",
      playerRanking: "2º melhor",
      result: "V"
    },
    {
      date: "2024-01-12",
      location: "Campo Norte",
      status: "Finalizado",
      score: "Time B 1x4 Time A", 
      playerRanking: "1º melhor",
      result: "V"
    },
    {
      date: "2024-01-08", 
      location: "Campo Sul",
      status: "Finalizado",
      score: "Time A 2x2 Time B",
      playerRanking: "4º melhor", 
      result: "E"
    }
  ];

  const nextGame = {
    date: "Sábado, 20 Jan",
    time: "15:00", 
    location: "Campo Central",
    playersConfirmed: 18,
    timeLeft: "2 dias"
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

  return (
    <div className="space-y-6">
      {/* Player Profile Section */}
      <Card className="relative overflow-hidden">
        <div 
          className="h-32 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${soccerFieldHero})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <CardContent className="relative -mt-8 pb-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16 border-4 border-background">
              <AvatarImage src={player.avatar} alt={player.name} />
              <AvatarFallback className="text-lg font-bold">
                {player.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{player.name}</h1>
              <p className="text-muted-foreground">"{player.nickname}" • {player.position}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {playerStats.map((stat, index) => (
          <Card key={index} className="smooth-transition hover:team-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance dos Últimos 5 Jogos */}
      <Card>
        <CardHeader>
          <CardTitle>Aproveitamento Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">{winPercentage}%</div>
              <p className="text-sm text-muted-foreground">Aproveitamento nos últimos 5 jogos</p>
            </div>
            <div className="flex justify-center space-x-2">
              {lastGamesResults.map((result, index) => (
                <div key={index} title={result === "V" ? "Vitória" : result === "D" ? "Derrota" : "Empate"}>
                  {getResultIcon(result)}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Game */}
      <Card className="hero-gradient text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Próximo Jogo</span>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {nextGame.timeLeft}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{nextGame.date}</span>
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
          <div className="text-sm">{nextGame.playersConfirmed} jogadores confirmados</div>
        </CardContent>
      </Card>

      {/* Recent Games with Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Jogos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentGames.map((game, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center space-x-3">
                  {getResultIcon(game.result)}
                  <div>
                    <p className="font-medium text-sm">{game.score}</p>
                    <p className="text-xs text-muted-foreground">{game.date} • {game.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs mb-1">
                    {game.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{game.playerRanking}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs for Team Admins */}
      {activeTeam && isTeamAdmin(activeTeam.id) && (
        <AuditLogs teamId={activeTeam.id} />
      )}
    </div>
  );
}