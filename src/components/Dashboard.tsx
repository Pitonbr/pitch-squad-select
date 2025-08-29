import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  Trophy, 
  Target,
  Plus,
  Clock,
  MapPin
} from "lucide-react";
import soccerFieldHero from "@/assets/soccer-field-hero.jpg";

export function Dashboard() {
  const stats = [
    {
      title: "Jogadores Ativos",
      value: "32",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Jogos Este Mês",
      value: "8",
      icon: Calendar,
      color: "text-teamA"
    },
    {
      title: "Taxa Check-in",
      value: "87%",
      icon: Target,
      color: "text-success"
    },
    {
      title: "Partidas Totais",
      value: "156",
      icon: Trophy,
      color: "text-teamB"
    }
  ];

  const recentGames = [
    {
      date: "2024-01-15",
      location: "Campo Central",
      status: "Finalizado",
      score: "Time A 3x2 Time B"
    },
    {
      date: "2024-01-12",
      location: "Campo Norte",
      status: "Finalizado", 
      score: "Time B 1x4 Time A"
    }
  ];

  const nextGame = {
    date: "Sábado, 20 Jan",
    time: "15:00",
    location: "Campo Central",
    playersConfirmed: 18,
    timeLeft: "2 dias"
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="relative overflow-hidden">
        <div 
          className="h-48 md:h-64 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${soccerFieldHero})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative h-full flex items-center justify-center text-white text-center p-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Campo Squad</h1>
              <p className="text-lg md:text-xl opacity-90">Gestão Inteligente de Partidas de Futebol</p>
              <Button 
                className="mt-4 bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 smooth-transition"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Novo Jogo
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
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
          <div className="flex items-center justify-between">
            <span className="text-sm">{nextGame.playersConfirmed} jogadores confirmados</span>
            <Button variant="secondary" size="sm" className="bg-white/20 text-white hover:bg-white/30">
              Ver Detalhes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Games */}
      <Card>
        <CardHeader>
          <CardTitle>Jogos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentGames.map((game, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{game.score}</p>
                  <p className="text-xs text-muted-foreground">{game.date} • {game.location}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {game.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button className="field-gradient h-16 flex-col space-y-1">
          <Plus className="h-5 w-5" />
          <span className="text-sm font-medium">Novo Jogo</span>
        </Button>
        <Button variant="outline" className="h-16 flex-col space-y-1 border-primary text-primary hover:bg-primary/10">
          <Users className="h-5 w-5" />
          <span className="text-sm font-medium">Gerenciar Jogadores</span>
        </Button>
      </div>
    </div>
  );
}