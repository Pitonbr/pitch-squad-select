import { useState } from "react";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";
import { PlayerForm } from "@/components/PlayerForm";
import { PlayerCard } from "@/components/PlayerCard";
import { GameForm } from "@/components/GameForm";
import { GameCard } from "@/components/GameCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Users, Calendar, Plus } from "lucide-react";

interface Player {
  id: string;
  name: string;
  nickname: string;
  position: string;
  phone: string;
  checkedIn?: boolean;
}

interface Game {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  status: "upcoming" | "checkin" | "closed" | "ongoing";
  playersCheckedIn: number;
}

const Index = () => {
  const [currentView, setCurrentView] = useState<"dashboard" | "players" | "games">("dashboard");
  const [players, setPlayers] = useState<Player[]>([
    {
      id: "1",
      name: "Carlos Silva",
      nickname: "Carlão",
      position: "Atacante",
      phone: "(11) 99999-0001",
      checkedIn: true
    },
    {
      id: "2", 
      name: "João Santos",
      nickname: "Joãozinho",
      position: "Goleiro",
      phone: "(11) 99999-0002"
    },
    {
      id: "3",
      name: "Pedro Costa",
      nickname: "Pedrinho",
      position: "Zagueiro", 
      phone: "(11) 99999-0003",
      checkedIn: true
    }
  ]);

  const [games, setGames] = useState<Game[]>([
    {
      id: "1",
      title: "Pelada da Galera - Sábado",
      date: "2024-01-20",
      time: "15:00",
      location: "Campo Central",
      status: "checkin",
      playersCheckedIn: 18
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const handlePlayerAdded = (playerData: Omit<Player, "id">) => {
    const newPlayer: Player = {
      ...playerData,
      id: Date.now().toString()
    };
    setPlayers([...players, newPlayer]);
  };

  const handleGameCreated = (gameData: Omit<Game, "id" | "status" | "playersCheckedIn">) => {
    const newGame: Game = {
      ...gameData,
      id: Date.now().toString(),
      status: "upcoming",
      playersCheckedIn: 0
    };
    setGames([...games, newGame]);
  };

  const handlePlayerCheckIn = (playerId: string) => {
    setPlayers(players.map(player => 
      player.id === playerId 
        ? { ...player, checkedIn: true }
        : player
    ));
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderPlayersView = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Jogadores</h2>
          <p className="text-muted-foreground">Cadastre e gerencie os jogadores do seu time</p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Users className="h-3 w-3" />
          <span>{players.length} jogadores</span>
        </Badge>
      </div>

      <PlayerForm onPlayerAdded={handlePlayerAdded} />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle>Lista de Jogadores</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar jogadores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum jogador encontrado.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  name={player.name}
                  nickname={player.nickname}
                  position={player.position}
                  phone={player.phone}
                  checkedIn={player.checkedIn}
                  onCheckIn={() => handlePlayerCheckIn(player.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderGamesView = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Jogos</h2>
          <p className="text-muted-foreground">Crie e acompanhe os jogos da temporada</p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span>{games.length} jogos</span>
        </Badge>
      </div>

      <GameForm onGameCreated={handleGameCreated} />

      <Card>
        <CardHeader>
          <CardTitle>Próximos Jogos</CardTitle>
        </CardHeader>
        <CardContent>
          {games.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum jogo agendado.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  title={game.title}
                  date={new Date(game.date).toLocaleDateString('pt-BR')}
                  time={game.time}
                  location={game.location}
                  playersCheckedIn={game.playersCheckedIn}
                  totalPlayers={22}
                  status={game.status}
                  timeLeft={game.status === "checkin" ? "2h 30min" : undefined}
                  onJoinGame={game.status === "checkin" ? () => {
                    console.log("Participar do jogo", game.id);
                  } : undefined}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="container mx-auto px-4 py-6">
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "players" && renderPlayersView()}
        {currentView === "games" && renderGamesView()}
      </main>
    </div>
  );
};

export default Index;
