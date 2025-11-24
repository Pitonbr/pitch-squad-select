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
import { GameDetailsCard } from "@/components/GameDetailsCard";
import { GameEditDialog } from "@/components/GameEditDialog";
import { PlayerInviteManager } from "@/components/PlayerInviteManager";
import { Dashboard } from "@/components/Dashboard";
import { TournamentManager } from "@/components/TournamentManager";
import { LiveGame } from "@/components/LiveGame";
import { Rankings } from "@/components/Rankings";
import { FinancialControl } from "@/components/FinancialControl";
import { CancelGameDialog } from "@/components/CancelGameDialog";
import { TeamManager } from "@/components/TeamManager";
import { TeamOnboarding } from "@/components/TeamOnboarding";
import { PlayerRequestsManager } from "@/components/PlayerRequestsManager";
import { TeamJoinRequests } from "@/components/TeamJoinRequests";
import { PlayerRemovalDialog } from "@/components/PlayerRemovalDialog";
import { AuditLogs } from "@/components/AuditLogs";
import { AttendanceStats } from "@/components/AttendanceStats";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { supabase } from "@/integrations/supabase/client";
import { Search, UserPlus, LogIn, Users, Calendar, Filter, Trash2 } from "lucide-react";
import { useRealtime, useRealtimeNotifications } from "@/hooks/useRealtime";
import { useAutoSave } from "@/hooks/useAutoSave";

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

type ViewType = "dashboard" | "players" | "addPlayer" | "games" | "addGame" | "tournaments" | "liveGame" | "rankings" | "teamManager" | "finances" | "requests" | "joinRequests" | "audit";

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { activeTeam, loading: teamsLoading, isTeamAdmin } = useTeams();
  
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [players, setPlayers] = useState<Player[]>([]);

  // Enable realtime notifications
  useRealtimeNotifications(activeTeam?.id);

  // Listen for player changes in real-time
  useRealtime({
    table: 'players',
    filter: activeTeam?.id ? `team_id=eq.${activeTeam.id}` : undefined,
    enabled: !!activeTeam?.id,
    onEvent: (event) => {
      console.log('[Index] Player event received:', event);
      // Refresh players when there are changes
      if (event.eventType === 'INSERT' || event.eventType === 'UPDATE' || event.eventType === 'DELETE') {
        fetchPlayersFromDB();
      }
    }
  });

  // Auto-save players data
  useAutoSave({
    data: players,
    saveFunction: async (playersData) => {
      // This is handled by individual operations, but we can add backup logic here
      console.log('[AutoSave] Players data synchronized');
    },
    enabled: false, // Disabled as players are already saved individually
    interval: 1000
  });
  
  // Function to fetch players from database
  const fetchPlayersFromDB = async () => {
    if (!activeTeam) return;
    
    try {
      const { data, error } = await supabase.rpc('get_team_players', {
        _team_id: activeTeam.id
      });

      if (error) {
        console.error('Error fetching players:', error);
        return;
      }

      // Map to match expected Player interface
      const playersData = data?.map((player: any) => ({
        id: player.id,
        name: player.name,
        nickname: player.nickname,
        position: player.position,
        phone: player.phone,
        profile_image: player.profile_image,
      })) || [];

      setPlayers(playersData);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };
  const [games, setGames] = useState<Game[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [gameToCancel, setGameToCancel] = useState<Game | null>(null);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const [gameToInvite, setGameToInvite] = useState<Game | null>(null);
  const [teamLists, setTeamLists] = useState<TeamList[]>([]);

  // Load existing data on component mount and when active team changes
  useEffect(() => {
    fetchPlayersFromDB();
  }, [activeTeam]);

  // Check authentication
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || teamsLoading) {
    return (
      <div className="min-h-screen stadium-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen stadium-bg flex items-center justify-center p-4">
        <Card variant="dark" className="w-full max-w-md text-center backdrop-blur-md">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-white text-glow-cyan mb-4">⚽ Soccer Squad</h1>
            <p className="text-white/70 mb-6">
              Faça login para acessar o sistema de gerenciamento de futebol
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full bg-primary hover:bg-accent text-white">
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

  const handlePlayerAdded = (player: any) => {
    // Refresh players from database instead of updating local state
    fetchPlayersFromDB();
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

  const handleGameUpdated = (updatedGame: Game) => {
    setGames(games.map(game => 
      game.id === updatedGame.id ? updatedGame : game
    ));
  };

  const handlePlayersInvited = (playerIds: string[]) => {
    if (gameToInvite) {
      setGames(games.map(game => 
        game.id === gameToInvite.id 
          ? { ...game, invitedPlayerIds: playerIds }
          : game
      ));
    }
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
      
      <AttendanceStats />
      
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
                <GameDetailsCard
                  key={game.id}
                  id={game.id}
                  title={game.title}
                  date={new Date(game.date).toLocaleDateString('pt-BR')}
                  time={game.time}
                  location={game.location}
                  description={game.description}
                  playersCheckedIn={game.playersCheckedIn || 0}
                  totalPlayers={game.invitedPlayerIds?.length || 22}
                  status={game.status}
                  timeLeft={game.status === "checkin" ? "2h 30min" : undefined}
                  isAdmin={true}
                  onEdit={() => setGameToEdit(game)}
                  onInvite={() => setGameToInvite(game)}
                  onJoin={game.status === "checkin" ? () => {
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
    <div className="min-h-screen stadium-bg">
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
      />
      <main className="container mx-auto px-4 py-8">
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "players" && renderPlayersView()}
        {currentView === "games" && renderGamesView()}
        {currentView === "tournaments" && <TournamentManager />}
        {currentView === "liveGame" && <LiveGame />}
        {currentView === "rankings" && <Rankings />}
        {currentView === "finances" && <FinancialControl />}
        {currentView === "teamManager" && <TeamManager />}
      </main>

      <CancelGameDialog
        isOpen={!!gameToCancel}
        onClose={() => setGameToCancel(null)}
        onConfirm={handleCancelGame}
        gameTitle={gameToCancel?.title || ""}
        invitedPlayersCount={gameToCancel?.invitedPlayerIds?.length || 0}
      />

      <GameEditDialog
        isOpen={!!gameToEdit}
        onClose={() => setGameToEdit(null)}
        game={gameToEdit}
        onGameUpdated={handleGameUpdated}
      />

      <PlayerInviteManager
        isOpen={!!gameToInvite}
        onClose={() => setGameToInvite(null)}
        game={gameToInvite}
        onPlayersInvited={handlePlayersInvited}
      />
    </div>
  );
}