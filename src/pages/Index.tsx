import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/Header";
import { PlayerForm } from "@/components/PlayerForm";
import { PlayerCard } from "@/components/PlayerCard";
import { GameForm } from "@/components/GameForm";
import { GameCard } from "@/components/GameCard";
import { GameDetailsCard } from "@/components/GameDetailsCard";
import { GameEditDialog } from "@/components/GameEditDialog";
import { PlayerInviteManager } from "@/components/PlayerInviteManager";
import { CancelGameDialog } from "@/components/CancelGameDialog";
import { TeamOnboarding } from "@/components/TeamOnboarding";
import { PlayerRequestsManager } from "@/components/PlayerRequestsManager";
import { TeamJoinRequests } from "@/components/TeamJoinRequests";
import { PlayerRemovalDialog } from "@/components/PlayerRemovalDialog";
import { AttendanceStats } from "@/components/AttendanceStats";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { supabase } from "@/integrations/supabase/client";
import { Search, UserPlus, LogIn, Users, Calendar, Filter, Trash2, ArrowUpDown } from "lucide-react";
import { useRealtime, useRealtimeNotifications } from "@/hooks/useRealtime";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useToast } from "@/hooks/use-toast";

const Dashboard = lazy(() => import("@/components/Dashboard").then(m => ({ default: m.Dashboard })));
const TournamentManager = lazy(() => import("@/components/TournamentManager").then(m => ({ default: m.TournamentManager })));
const LiveGame = lazy(() => import("@/components/LiveGame").then(m => ({ default: m.LiveGame })));
const Rankings = lazy(() => import("@/components/Rankings").then(m => ({ default: m.Rankings })));
const FinancialControl = lazy(() => import("@/components/FinancialControl").then(m => ({ default: m.FinancialControl })));
const TeamManager = lazy(() => import("@/components/TeamManager").then(m => ({ default: m.TeamManager })));
const ManagementPanel = lazy(() => import("@/components/ManagementPanel").then(m => ({ default: m.ManagementPanel })));
const Settings = lazy(() => import("@/components/Settings").then(m => ({ default: m.Settings })));

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
  status: "scheduled" | "upcoming" | "checkin" | "closed" | "ongoing" | "finished" | "not_realized" | "cancelled";
  playersCheckedIn: number;
  invitedPlayerIds: string[];
  home_score?: number;
  away_score?: number;
}

type ViewType = "dashboard" | "players" | "addPlayer" | "games" | "addGame" | "tournaments" | "liveGame" | "rankings" | "teamManager" | "finances" | "requests" | "joinRequests" | "audit" | "management" | "settings";

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { activeTeam, loading: teamsLoading, isTeamAdmin, getUserRole } = useTeams();
  const { toast } = useToast();
  
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [players, setPlayers] = useState<Player[]>([]);

  // Function to fetch players from database
  const fetchPlayersFromDB = useCallback(async () => {
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
  }, [activeTeam]);

  // Function to fetch games from database
  const fetchGamesFromDB = useCallback(async () => {
    if (!activeTeam) return;
    
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*, game_participants(player_id, status)')
        .eq('team_id', activeTeam.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('Error fetching games:', error);
        return;
      }

      // Marcar jogos não realizados
      const now = new Date();
      const gamesData = data?.map((game: any) => {
        let gameStatus = game.status;
        
        // Verificar se o jogo passou da data/hora e não foi ativado
        if (gameStatus === 'scheduled') {
          const gameDateTime = new Date(`${game.date}T${game.time}`);
          const twoHoursAfter = new Date(gameDateTime.getTime() + (2 * 60 * 60 * 1000));
          
          if (now > twoHoursAfter && !game.is_match_active && !game.match_time_started) {
            gameStatus = 'not_realized';
            
            // Atualizar no banco de dados
            supabase
              .from('games')
              .update({ status: 'not_realized' })
              .eq('id', game.id)
              .then(() => console.log(`Game ${game.id} marked as not_realized`));
          }
        }

        return {
          id: game.id,
          title: game.title,
          date: game.date,
          time: game.time,
          location: game.location,
          description: game.description,
          status: gameStatus,
          playersCheckedIn: game.game_participants?.filter((p: any) => p.status === 'confirmed').length || 0,
          invitedPlayerIds: game.game_participants?.map((p: any) => p.player_id) || [],
          home_score: game.home_score,
          away_score: game.away_score
        };
      }) || [];

      setGames(gamesData);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  }, [activeTeam]);

  // Enable realtime notifications
  useRealtimeNotifications(activeTeam?.id);

  // Memoized realtime event handlers
  const handlePlayerEvent = useCallback((event: any) => {
    console.log('[Index] Player event received:', event);
    if (event.eventType === 'INSERT' || event.eventType === 'UPDATE' || event.eventType === 'DELETE') {
      fetchPlayersFromDB();
    }
  }, [fetchPlayersFromDB]);

  const handleGameEvent = useCallback((event: any) => {
    console.log('[Index] Game event received:', event);
    if (event.eventType === 'INSERT' || event.eventType === 'UPDATE' || event.eventType === 'DELETE') {
      fetchGamesFromDB();
    }
  }, [fetchGamesFromDB]);

  const handleGameParticipantEvent = useCallback((event: any) => {
    console.log('[Index] Game participant event received:', event);
    fetchGamesFromDB();
  }, [fetchGamesFromDB]);

  // Listen for player changes in real-time
  useRealtime({
    table: 'players',
    filter: activeTeam?.id ? `team_id=eq.${activeTeam.id}` : undefined,
    enabled: !!activeTeam?.id,
    onEvent: handlePlayerEvent
  });

  // Listen for game changes in real-time
  useRealtime({
    table: 'games',
    filter: activeTeam?.id ? `team_id=eq.${activeTeam.id}` : undefined,
    enabled: !!activeTeam?.id,
    onEvent: handleGameEvent
  });

  // Listen for game_participants changes in real-time
  useRealtime({
    table: 'game_participants',
    enabled: !!activeTeam?.id,
    onEvent: handleGameParticipantEvent
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
  
  const [games, setGames] = useState<Game[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [gameToCancel, setGameToCancel] = useState<Game | null>(null);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const [gameToInvite, setGameToInvite] = useState<Game | null>(null);
  const [teamLists, setTeamLists] = useState<TeamList[]>([]);
  const [gameSortBy, setGameSortBy] = useState<'date-asc' | 'date-desc' | 'status' | 'participants'>('date-asc');

  // Load existing data on component mount and when active team changes
  useEffect(() => {
    fetchPlayersFromDB();
    fetchGamesFromDB();
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

  const handleGameCreated = async (gameData: { 
    title: string; 
    date: string; 
    time: string; 
    location: string; 
    description?: string; 
    invitedPlayerIds: string[];
    checkinDeadlineMinutes: number;
  }) => {
    if (!activeTeam) return;

    try {
      // Insert game into database
      const { data: newGame, error: gameError } = await supabase
        .from('games')
        .insert({
          team_id: activeTeam.id,
          title: gameData.title,
          date: gameData.date,
          time: gameData.time,
          location: gameData.location,
          description: gameData.description,
          checkin_deadline_minutes: gameData.checkinDeadlineMinutes,
          status: 'scheduled'
        })
        .select()
        .single();

      if (gameError) {
        console.error('Error creating game:', gameError);
        toast({
          title: "Erro ao criar jogo",
          description: gameError.message,
          variant: "destructive"
        });
        return;
      }

      // Add invited players as participants
      if (gameData.invitedPlayerIds.length > 0) {
        const participants = gameData.invitedPlayerIds.map(playerId => ({
          game_id: newGame.id,
          player_id: playerId,
          status: 'invited',
          invited_at: new Date().toISOString()
        }));

        const { error: participantsError } = await supabase
          .from('game_participants')
          .insert(participants);

        if (participantsError) {
          console.error('Error adding participants:', participantsError);
        }
      }

      // Refresh games from database
      await fetchGamesFromDB();

      toast({
        title: "Jogo criado!",
        description: `${gameData.title} foi adicionado ao calendário.`
      });
    } catch (error) {
      console.error('Error in handleGameCreated:', error);
      toast({
        title: "Erro ao criar jogo",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
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

  const renderPlayersView = () => {
    const userRole = activeTeam ? getUserRole(activeTeam.id) : null;
    const isPlayer = userRole === 'player';

    return (
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

        {!isPlayer && isTeamAdmin(activeTeam.id) && <PlayerRequestsManager />}
        
        <AttendanceStats />
        
        {!isPlayer && <PlayerForm onPlayerAdded={handlePlayerAdded} />}

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
                  {!isPlayer && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleDeletePlayer(player.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    );
  };

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
          <div className="flex items-center justify-between">
            <CardTitle>Próximos Jogos</CardTitle>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={gameSortBy} onValueChange={(value: any) => setGameSortBy(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-asc">Data (Mais próxima)</SelectItem>
                  <SelectItem value="date-desc">Data (Mais distante)</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="participants">Nº de Participantes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            // Filtrar apenas jogos futuros (excluir finalizados e não realizados)
            let upcomingGames = games.filter(game => 
              !['finished', 'not_realized', 'cancelled'].includes(game.status)
            );

            // Aplicar ordenação
            switch (gameSortBy) {
              case 'date-asc':
                upcomingGames = [...upcomingGames].sort((a, b) => {
                  const dateA = new Date(`${a.date}T${a.time}`);
                  const dateB = new Date(`${b.date}T${b.time}`);
                  return dateA.getTime() - dateB.getTime();
                });
                break;
              case 'date-desc':
                upcomingGames = [...upcomingGames].sort((a, b) => {
                  const dateA = new Date(`${a.date}T${a.time}`);
                  const dateB = new Date(`${b.date}T${b.time}`);
                  return dateB.getTime() - dateA.getTime();
                });
                break;
              case 'status':
                const statusOrder = { 'checkin': 0, 'scheduled': 1, 'in_progress': 2 };
                upcomingGames = [...upcomingGames].sort((a, b) => {
                  const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 999;
                  const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 999;
                  return orderA - orderB;
                });
                break;
              case 'participants':
                upcomingGames = [...upcomingGames].sort((a, b) => {
                  return (b.playersCheckedIn || 0) - (a.playersCheckedIn || 0);
                });
                break;
            }

            return upcomingGames.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum jogo agendado.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {upcomingGames.map((game) => (
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
                    rawDate={game.date}
                    checkinDeadlineMinutes={game.checkin_deadline_minutes || 30}
                    timeLeft={undefined}
                    isAdmin={true}
                    onEdit={() => setGameToEdit(game)}
                    onInvite={() => setGameToInvite(game)}
                    onJoin={game.status === "checkin" ? () => {
                      console.log("Participar do jogo", game.id);
                    } : undefined}
                    homeScore={game.home_score}
                    awayScore={game.away_score}
                  />
                ))}
              </div>
            );
          })()}
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
        <Suspense fallback={<div className="flex items-center justify-center h-48 text-white/50">Carregando...</div>}>
          {currentView === "dashboard" && <Dashboard />}
          {currentView === "players" && renderPlayersView()}
          {currentView === "games" && renderGamesView()}
          {currentView === "tournaments" && <TournamentManager />}
          {currentView === "liveGame" && <LiveGame />}
          {currentView === "rankings" && <Rankings />}
          {currentView === "finances" && <FinancialControl />}
          {currentView === "teamManager" && <TeamManager />}
          {currentView === "management" && <ManagementPanel />}
          {currentView === "settings" && <Settings />}
        </Suspense>
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