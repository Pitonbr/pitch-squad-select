import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { PlayerForm } from "@/components/PlayerForm";
import { PlayerCard } from "@/components/PlayerCard";
import { GameForm } from "@/components/GameForm";
import { GameCard } from "@/components/GameCard";
import { Dashboard } from "@/components/Dashboard";
import { TournamentManager } from "@/components/TournamentManager";
import { LiveGame } from "@/components/LiveGame";
import { Rankings } from "@/components/Rankings";
import { FinancialControl } from "@/components/FinancialControl";
import { CancelGameDialog } from "@/components/CancelGameDialog";
import { TeamManager } from "@/components/TeamManager";
import { TeamOnboarding } from "@/components/TeamOnboarding";
import { PlayerRequestsManager } from "@/components/PlayerRequestsManager";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { Search, UserPlus, LogIn, Users, Calendar, Filter, Trash2 } from "lucide-react";

interface Player {
  id: string;
  name: string;
  nickname: string;
  position: string;
  phone: string;
  email?: string;
  jersey_number?: number;
  profile_image?: string;
  checkedIn?: boolean;
}

interface TeamList {
  id: string;
  name: string;
  playerIds: string[];
  createdAt: Date;
}

interface Game {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  status: "upcoming" | "checkin" | "closed" | "ongoing" | "cancelled";
  playersCheckedIn: number;
  invitedPlayerIds: string[];
}

type ViewType = "dashboard" | "players" | "games" | "tournaments" | "live" | "rankings" | "financial" | "teams";

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { activeTeam, loading: teamsLoading, isTeamAdmin } = useTeams();
  
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [gameToCancel, setGameToCancel] = useState<Game | null>(null);
  const [teamLists, setTeamLists] = useState<TeamList[]>([]);

  // Check authentication
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || teamsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-4">⚽ Soccer Manager</h1>
            <p className="text-muted-foreground mb-6">
              Faça login para acessar o sistema de gerenciamento de futebol
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // CRITICAL: Mandatory team association - Block access if no active team
  if (!activeTeam) {
    return <TeamOnboarding />;
  }

  const handlePlayerAdded = (playerData: any) => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: playerData.name,
      nickname: playerData.nickname,
      position: playerData.position,
      phone: playerData.phone,
      email: playerData.email,
      jersey_number: typeof playerData.jersey_number === 'string' 
        ? (playerData.jersey_number ? parseInt(playerData.jersey_number) : undefined)
        : playerData.jersey_number,
      profile_image: playerData.profile_image,
      checkedIn: false
    };
    setPlayers([...players, newPlayer]);
  };

  const handleGameCreated = (gameData: { 
    title: string; 
    date: string; 
    time: string; 
    location: string; 
    description?: string; 
    invitedPlayerIds: string[] 
  }) => {
    const newGame: Game = {
      id: Date.now().toString(),
      ...gameData,
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

  const handleDeletePlayer = (playerId: string) => {
    setPlayers(players.filter(player => player.id !== playerId));
  };

  const handleTeamListSave = (teamListData: Omit<TeamList, 'id' | 'createdAt'>) => {
    const newTeamList: TeamList = {
      id: Date.now().toString(),
      ...teamListData,
      createdAt: new Date()
    };
    setTeamLists([...teamLists, newTeamList]);
  };

  const handleTeamListDelete = (teamListId: string) => {
    setTeamLists(teamLists.filter(tl => tl.id !== teamListId));
  };

  const handleCancelGame = (message: string) => {
    if (!gameToCancel) return;
    
    setGames(games.map(game => 
      game.id === gameToCancel.id 
        ? { ...game, status: "cancelled" as const }
        : game
    ));
    
    if (message) {
      console.log(`Mensagem de cancelamento enviada para ${gameToCancel.invitedPlayerIds?.length || 0} jogadores: ${message}`);
    }
    
    setGameToCancel(null);
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

      {isTeamAdmin(activeTeam.id) && <PlayerRequestsManager />}
      
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
                <div key={player.id} className="relative">
                  <PlayerCard
                    id={player.id}
                    name={player.name}
                    nickname={player.nickname}
                    position={player.position}
                    phone={player.phone}
                    email={player.email}
                    jersey_number={player.jersey_number}
                    profile_image={player.profile_image}
                    checkedIn={player.checkedIn || false}
                    onCheckIn={handlePlayerCheckIn}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleDeletePlayer(player.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
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

      <GameForm 
        allPlayers={players}
        teamLists={teamLists}
        onGameCreated={handleGameCreated}
        onTeamListSave={handleTeamListSave}
        onTeamListDelete={handleTeamListDelete}
      />

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
                  totalPlayers={game.invitedPlayerIds?.length || 22}
                  status={game.status}
                  timeLeft={game.status === "checkin" ? "2h 30min" : undefined}
                  isAdmin={true}
                  onJoinGame={game.status === "checkin" ? () => {
                    console.log("Participar do jogo", game.id);
                  } : undefined}
                  onCancelGame={() => setGameToCancel(game)}
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
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
      />
      <main className="container mx-auto px-4 py-8">
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "players" && renderPlayersView()}
        {currentView === "games" && renderGamesView()}
        {currentView === "tournaments" && <TournamentManager />}
        {currentView === "live" && <LiveGame />}
        {currentView === "rankings" && <Rankings />}
        {currentView === "financial" && <FinancialControl />}
        {currentView === "teams" && <TeamManager />}
      </main>

      <CancelGameDialog
        isOpen={!!gameToCancel}
        onClose={() => setGameToCancel(null)}
        onConfirm={handleCancelGame}
        gameTitle={gameToCancel?.title || ""}
        invitedPlayersCount={gameToCancel?.invitedPlayerIds?.length || 0}
      />
    </div>
  );
}