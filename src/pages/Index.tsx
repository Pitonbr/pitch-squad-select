// ============================================================
// src/pages/Index.tsx  — VERSÃO COMPLETA (Fases 1, 2, 3 e 4)
// Todas as melhorias integradas:
//   F1: AppLayout (Sidebar + BottomNav)
//   F2: ViewType centralizado, tema corrigido
//   F3: DashboardMetrics, EmptyState, ViewTransition, Skeletons
//   F4: TeamMatchmaking, CourtFinder, AppOnboarding
// ============================================================

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// F1 — Layout
import { AppLayout } from "@/components/AppLayout";
import { ViewType } from "@/types/navigation";

// F3 — UX melhorado
import { ViewTransition } from "@/components/ViewTransition";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList, SkeletonDashboard } from "@/components/SkeletonCard";
import { DashboardMetrics } from "@/components/DashboardMetrics";

// F4 — Novas funcionalidades
import { TeamMatchmaking } from "@/components/TeamMatchmaking";
import { CourtFinder } from "@/components/CourtFinder";
import { AppOnboarding, useOnboarding } from "@/components/AppOnboarding";

// Componentes existentes
import { PlayerForm } from "@/components/PlayerForm";
import { PlayerCard } from "@/components/PlayerCard";
import { GameForm } from "@/components/GameForm";
import { GameDetailsCard } from "@/components/GameDetailsCard";
import { GameEditDialog } from "@/components/GameEditDialog";
import { PlayerInviteManager } from "@/components/PlayerInviteManager";
import { CancelGameDialog } from "@/components/CancelGameDialog";
import { TeamOnboarding } from "@/components/TeamOnboarding";
import { PlayerRequestsManager } from "@/components/PlayerRequestsManager";
import { AttendanceStats } from "@/components/AttendanceStats";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { supabase } from "@/integrations/supabase/client";
import { Search, LogIn, Users, Calendar, Filter, Trash2, ArrowUpDown } from "lucide-react";
import { useRealtime, useRealtimeNotifications } from "@/hooks/useRealtime";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useToast } from "@/hooks/use-toast";

// Lazy-loaded views pesadas
const Dashboard       = lazy(() => import("@/components/Dashboard").then(m => ({ default: m.Dashboard })));
const TournamentManager = lazy(() => import("@/components/TournamentManager").then(m => ({ default: m.TournamentManager })));
const LiveGame        = lazy(() => import("@/components/LiveGame").then(m => ({ default: m.LiveGame })));
const Rankings        = lazy(() => import("@/components/Rankings").then(m => ({ default: m.Rankings })));
const FinancialControl= lazy(() => import("@/components/FinancialControl").then(m => ({ default: m.FinancialControl })));
const TeamManager     = lazy(() => import("@/components/TeamManager").then(m => ({ default: m.TeamManager })));
const ManagementPanel = lazy(() => import("@/components/ManagementPanel").then(m => ({ default: m.ManagementPanel })));
const Settings        = lazy(() => import("@/components/Settings").then(m => ({ default: m.Settings })));

// ── Interfaces ──────────────────────────────────────────────
interface Player {
  id: string; name: string; nickname: string; position: string;
  phone: string; email?: string; jersey_number?: number;
  profile_image?: string; skill_level?: number; checkedIn?: boolean;
}

interface TeamList {
  id: string; name: string; playerIds: string[]; createdAt: Date;
}

interface Game {
  id: string; title: string; date: string; time: string;
  location: string; description?: string;
  status: "scheduled"|"upcoming"|"checkin"|"closed"|"ongoing"|"finished"|"not_realized"|"cancelled";
  playersCheckedIn: number; invitedPlayerIds: string[];
  home_score?: number; away_score?: number; checkin_deadline_minutes?: number;
}

// ── Componente principal ────────────────────────────────────
export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { activeTeam, loading: teamsLoading, isTeamAdmin, getUserRole } = useTeams();
  const { toast } = useToast();
  const { showOnboarding, completeOnboarding } = useOnboarding();   // F4

  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [gameToCancel, setGameToCancel] = useState<Game | null>(null);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const [gameToInvite, setGameToInvite] = useState<Game | null>(null);
  const [teamLists, setTeamLists] = useState<TeamList[]>([]);
  const [gameSortBy, setGameSortBy] = useState<"date-asc"|"date-desc"|"status"|"participants">("date-asc");

  // ── Fetches ─────────────────────────────────────────────────
  const fetchPlayersFromDB = useCallback(async () => {
    if (!activeTeam) return;
    try {
      const { data, error } = await supabase.rpc("get_team_players", { _team_id: activeTeam.id });
      if (error) return;
      setPlayers(data?.map((p: any) => ({
        id: p.id, name: p.name, nickname: p.nickname, position: p.position,
        phone: p.phone, profile_image: p.profile_image, skill_level: p.skill_level,
      })) || []);
    } catch {}
  }, [activeTeam]);

  const fetchGamesFromDB = useCallback(async () => {
    if (!activeTeam) return;
    try {
      const { data, error } = await supabase
        .from("games").select("*, game_participants(player_id, status)")
        .eq("team_id", activeTeam.id)
        .order("date", { ascending: true }).order("time", { ascending: true });
      if (error) return;
      const now = new Date();
      setGames(data?.map((game: any) => {
        let status = game.status;
        if (status === "scheduled") {
          const dt = new Date(`${game.date}T${game.time}`);
          if (now > new Date(dt.getTime() + 2 * 3600000) && !game.is_match_active && !game.match_time_started) {
            status = "not_realized";
            supabase.from("games").update({ status: "not_realized" }).eq("id", game.id).then(() => {});
          }
        }
        return {
          id: game.id, title: game.title, date: game.date, time: game.time,
          location: game.location, description: game.description, status,
          checkin_deadline_minutes: game.checkin_deadline_minutes,
          playersCheckedIn: game.game_participants?.filter((p: any) => p.status === "confirmed").length || 0,
          invitedPlayerIds: game.game_participants?.map((p: any) => p.player_id) || [],
          home_score: game.home_score, away_score: game.away_score,
        };
      }) || []);
    } catch {}
  }, [activeTeam]);

  useRealtimeNotifications(activeTeam?.id);
  const handlePlayerEvent = useCallback((e: any) => { if (["INSERT","UPDATE","DELETE"].includes(e.eventType)) fetchPlayersFromDB(); }, [fetchPlayersFromDB]);
  const handleGameEvent   = useCallback((e: any) => { if (["INSERT","UPDATE","DELETE"].includes(e.eventType)) fetchGamesFromDB(); }, [fetchGamesFromDB]);
  useRealtime({ table: "players", filter: activeTeam?.id ? `team_id=eq.${activeTeam.id}` : undefined, enabled: !!activeTeam?.id, onEvent: handlePlayerEvent });
  useRealtime({ table: "games",   filter: activeTeam?.id ? `team_id=eq.${activeTeam.id}` : undefined, enabled: !!activeTeam?.id, onEvent: handleGameEvent });
  useRealtime({ table: "game_participants", enabled: !!activeTeam?.id, onEvent: handleGameEvent });
  useAutoSave({ data: players, saveFunction: async () => {}, enabled: false, interval: 1000 });

  useEffect(() => { fetchPlayersFromDB(); fetchGamesFromDB(); }, [activeTeam]);
  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  // ── Guards ──────────────────────────────────────────────────
  if (loading || teamsLoading) return (
    <div className="min-h-screen stadium-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-white">Carregando...</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen stadium-bg flex items-center justify-center p-4">
      <Card variant="dark" className="w-full max-w-md text-center backdrop-blur-md">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-white text-glow-cyan mb-4">⚽ Soccer Squad</h1>
          <p className="text-white/70 mb-6">Faça login para acessar o sistema de gerenciamento de futebol</p>
          <Button onClick={() => navigate("/auth")} className="w-full bg-primary hover:bg-accent text-white">
            <LogIn className="h-4 w-4 mr-2" />Fazer Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  if (!activeTeam) return <TeamOnboarding />;

  // ── Handlers ─────────────────────────────────────────────────
  const handlePlayerAdded = () => fetchPlayersFromDB();

  const handleGameCreated = async (d: { title:string; date:string; time:string; location:string; description?:string; invitedPlayerIds:string[]; checkinDeadlineMinutes:number; }) => {
    if (!activeTeam) return;
    try {
      const { data: ng, error } = await supabase.from("games")
        .insert({ team_id: activeTeam.id, title: d.title, date: d.date, time: d.time, location: d.location, description: d.description, checkin_deadline_minutes: d.checkinDeadlineMinutes, status: "scheduled" })
        .select().single();
      if (error) { toast({ title: "Erro ao criar jogo", description: error.message, variant: "destructive" }); return; }
      if (d.invitedPlayerIds.length > 0) {
        await supabase.from("game_participants").insert(d.invitedPlayerIds.map(pid => ({ game_id: ng.id, player_id: pid, status: "invited", invited_at: new Date().toISOString() })));
      }
      await fetchGamesFromDB();
      toast({ title: "Jogo criado!", description: `${d.title} foi adicionado ao calendário.` });
    } catch { toast({ title: "Erro ao criar jogo", description: "Ocorreu um erro inesperado.", variant: "destructive" }); }
  };

  const handlePlayerCheckIn  = (id: string) => setPlayers(p => p.map(pl => pl.id === id ? { ...pl, checkedIn: true } : pl));
  const handleDeletePlayer   = (id: string) => setPlayers(p => p.filter(pl => pl.id !== id));
  const handleTeamListSave   = (d: Omit<TeamList,"id"|"createdAt">) => setTeamLists(l => [...l, { id: Date.now().toString(), ...d, createdAt: new Date() }]);
  const handleTeamListDelete = (id: string) => setTeamLists(l => l.filter(t => t.id !== id));
  const handleGameUpdated    = (g: Game) => setGames(gs => gs.map(x => x.id === g.id ? g : x));
  const handlePlayersInvited = (ids: string[]) => { if (gameToInvite) setGames(gs => gs.map(g => g.id === gameToInvite.id ? { ...g, invitedPlayerIds: ids } : g)); };
  const handleCancelGame     = () => {
    if (!gameToCancel) return;
    setGames(gs => gs.map(g => g.id === gameToCancel.id ? { ...g, status: "cancelled" as const } : g));
    setGameToCancel(null);
  };

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Views ────────────────────────────────────────────────────
  const renderPlayersView = () => {
    const isPlayer = getUserRole(activeTeam.id) === "player";
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Jogadores</h2>
            <p className="text-muted-foreground">Cadastre e gerencie os jogadores do seu time</p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1"><Users className="h-3 w-3" />{players.length} jogadores</Badge>
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar jogadores..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 w-64" />
                </div>
                <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" />Filtros</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPlayers.length === 0
              ? <EmptyState icon={Users} title="Nenhum jogador encontrado" description="Adicione jogadores ao time ou ajuste o filtro de busca" actionLabel="Adicionar jogador" onAction={() => {}} />
              : <div className="grid gap-4">
                  {filteredPlayers.map(player => (
                    <div key={player.id} className="relative">
                      <PlayerCard {...player} checkedIn={player.checkedIn || false} onCheckIn={handlePlayerCheckIn} />
                      {!isPlayer && (
                        <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => handleDeletePlayer(player.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
            }
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderGamesView = () => {
    let upcoming = games.filter(g => !["finished","not_realized","cancelled"].includes(g.status));
    switch (gameSortBy) {
      case "date-asc":      upcoming.sort((a,b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()); break;
      case "date-desc":     upcoming.sort((a,b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime()); break;
      case "status":        const so:Record<string,number> = {checkin:0,scheduled:1,in_progress:2}; upcoming.sort((a,b)=>(so[a.status]??999)-(so[b.status]??999)); break;
      case "participants":  upcoming.sort((a,b) => (b.playersCheckedIn||0)-(a.playersCheckedIn||0)); break;
    }
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div><h2 className="text-2xl font-bold">Gerenciar Jogos</h2><p className="text-muted-foreground">Crie e acompanhe os jogos da temporada</p></div>
          <Badge variant="outline" className="flex items-center gap-1"><Calendar className="h-3 w-3" />{games.length} jogos</Badge>
        </div>
        <GameForm allPlayers={players} teamLists={teamLists} onGameCreated={handleGameCreated} onTeamListSave={handleTeamListSave} onTeamListDelete={handleTeamListDelete} />
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Próximos Jogos</CardTitle>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={gameSortBy} onValueChange={(v:any) => setGameSortBy(v)}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
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
            {upcoming.length === 0
              ? <EmptyState icon={Calendar} title="Nenhum jogo agendado" description="Crie o primeiro jogo da temporada usando o formulário acima" />
              : <div className="grid gap-4">
                  {upcoming.map(game => (
                    <GameDetailsCard
                      key={game.id} id={game.id} title={game.title}
                      date={new Date(game.date).toLocaleDateString("pt-BR")}
                      time={game.time} location={game.location} description={game.description}
                      playersCheckedIn={game.playersCheckedIn||0} totalPlayers={game.invitedPlayerIds?.length||22}
                      status={game.status} rawDate={game.date}
                      checkinDeadlineMinutes={game.checkin_deadline_minutes||30}
                      timeLeft={undefined} isAdmin={true}
                      onEdit={() => setGameToEdit(game)} onInvite={() => setGameToInvite(game)}
                      onJoin={game.status==="checkin" ? () => {} : undefined}
                      homeScore={game.home_score} awayScore={game.away_score}
                    />
                  ))}
                </div>
            }
          </CardContent>
        </Card>
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      {/* F4 — Onboarding para novos usuários */}
      {showOnboarding && <AppOnboarding onComplete={completeOnboarding} />}

      <AppLayout currentView={currentView} onViewChange={setCurrentView}>
        <ViewTransition viewKey={currentView}>
          <Suspense fallback={<SkeletonDashboard />}>
            {currentView === "dashboard"   && (
              <>
                <DashboardMetrics onNavigate={setCurrentView} />
                <Dashboard />
              </>
            )}
            {currentView === "players"     && renderPlayersView()}
            {currentView === "games"       && renderGamesView()}
            {currentView === "tournaments" && <TournamentManager />}
            {currentView === "liveGame"    && <LiveGame />}
            {currentView === "rankings"    && <Rankings />}
            {currentView === "finances"    && <FinancialControl />}
            {currentView === "teamManager" && <TeamManager />}
            {currentView === "management"  && <ManagementPanel />}
            {currentView === "settings"    && <Settings />}
            {/* F4 — Novas views */}
            {currentView === "requests"    && <TeamMatchmaking />}
            {currentView === "joinRequests"&& <CourtFinder />}
          </Suspense>
        </ViewTransition>

        {/* Dialogs globais */}
        <CancelGameDialog isOpen={!!gameToCancel} onClose={() => setGameToCancel(null)} onConfirm={handleCancelGame} gameTitle={gameToCancel?.title||""} invitedPlayersCount={gameToCancel?.invitedPlayerIds?.length||0} />
        <GameEditDialog isOpen={!!gameToEdit} onClose={() => setGameToEdit(null)} game={gameToEdit} onGameUpdated={handleGameUpdated} />
        <PlayerInviteManager isOpen={!!gameToInvite} onClose={() => setGameToInvite(null)} game={gameToInvite} onPlayersInvited={handlePlayersInvited} />
      </AppLayout>
    </>
  );
}
