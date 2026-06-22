import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Users, TrendingUp, TrendingDown, Minus, CalendarCheck, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTeams } from "@/hooks/useTeams";

interface TeamHealth {
  period_days: number;
  games_played: number;
  confirmation_rate: number | null;
  attendance_rate: number | null;
  active_members: number;
  previous_attendance_rate: number | null;
  trend: "subindo" | "caindo" | "estavel" | "sem_dados";
}

interface PlayerHealth {
  period_days: number;
  team_id: string;
  games_invited: number;
  confirmation_rate: number | null;
  attendance_rate: number | null;
  previous_attendance_rate: number | null;
  trend: "subindo" | "caindo" | "estavel" | "sem_dados";
}

interface Player {
  id: string;
  name: string;
  nickname: string;
}

const TrendBadge = ({ trend }: { trend: string }) => {
  if (trend === "subindo") {
    return <Badge className="bg-success/20 text-success border border-success/40 gap-1"><TrendingUp className="h-3 w-3" /> Subindo</Badge>;
  }
  if (trend === "caindo") {
    return <Badge className="bg-destructive/20 text-destructive border border-destructive/40 gap-1"><TrendingDown className="h-3 w-3" /> Caindo</Badge>;
  }
  if (trend === "estavel") {
    return <Badge variant="secondary" className="gap-1"><Minus className="h-3 w-3" /> Estável</Badge>;
  }
  return <Badge variant="outline">Sem dados suficientes</Badge>;
};

function MetricCard({ icon: Icon, label, value, suffix = "" }: { icon: React.ElementType; label: string; value: string | number; suffix?: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
        <div className="text-2xl font-bold">{value}{suffix}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function TeamHealthPanel() {
  const { activeTeam } = useTeams();
  const [health, setHealth] = useState<TeamHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    if (!activeTeam?.id) return;
    setLoading(true);
    const { data } = await supabase.rpc("get_team_health_metrics", { p_team_id: activeTeam.id, p_days: 30 });
    setHealth(data as unknown as TeamHealth);
    setLoading(false);
  }, [activeTeam?.id]);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!health) return <p className="text-sm text-muted-foreground">Sem dados disponíveis.</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={CheckCircle2} label="Comparecimento médio" value={health.attendance_rate ?? "—"} suffix={health.attendance_rate != null ? "%" : ""} />
        <MetricCard icon={CalendarCheck} label="Taxa de confirmação" value={health.confirmation_rate ?? "—"} suffix={health.confirmation_rate != null ? "%" : ""} />
        <MetricCard icon={Users} label="Membros ativos" value={health.active_members} />
        <MetricCard icon={Activity} label="Jogos no período" value={health.games_played} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Tendência (últimos {health.period_days} dias vs. período anterior):</span>
        <TrendBadge trend={health.trend} />
      </div>
    </div>
  );
}

function PlayerHealthCard({ player, health }: { player: Player; health: PlayerHealth | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{player.name} <span className="text-muted-foreground font-normal">"{player.nickname}"</span></CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!health ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <MetricCard icon={CheckCircle2} label="Comparecimento" value={health.attendance_rate ?? "—"} suffix={health.attendance_rate != null ? "%" : ""} />
              <MetricCard icon={CalendarCheck} label="Confirmação" value={health.confirmation_rate ?? "—"} suffix={health.confirmation_rate != null ? "%" : ""} />
              <MetricCard icon={Activity} label="Convocações" value={health.games_invited} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Tendência:</span>
              <TrendBadge trend={health.trend} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PlayerHealthPanel() {
  const { activeTeam } = useTeams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerAId, setPlayerAId] = useState("");
  const [playerBId, setPlayerBId] = useState("");
  const [healthA, setHealthA] = useState<PlayerHealth | null>(null);
  const [healthB, setHealthB] = useState<PlayerHealth | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!activeTeam?.id) return;
      const { data } = await supabase.rpc("get_team_players", { _team_id: activeTeam.id });
      if (data) setPlayers(data as Player[]);
    };
    fetchPlayers();
  }, [activeTeam?.id]);

  useEffect(() => {
    const fetchHealthA = async () => {
      if (!playerAId) { setHealthA(null); return; }
      const { data } = await supabase.rpc("get_player_health_metrics", { p_player_id: playerAId, p_days: 30 });
      setHealthA(data as unknown as PlayerHealth);
    };
    fetchHealthA();
  }, [playerAId]);

  useEffect(() => {
    const fetchHealthB = async () => {
      if (!playerBId) { setHealthB(null); return; }
      const { data } = await supabase.rpc("get_player_health_metrics", { p_player_id: playerBId, p_days: 30 });
      setHealthB(data as unknown as PlayerHealth);
    };
    fetchHealthB();
  }, [playerBId]);

  const playerA = players.find((p) => p.id === playerAId);
  const playerB = players.find((p) => p.id === playerBId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={playerAId} onValueChange={setPlayerAId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Selecionar jogador" />
          </SelectTrigger>
          <SelectContent>
            {players.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nickname || p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          className="text-xs underline text-muted-foreground"
          onClick={() => setCompareMode((c) => !c)}
        >
          {compareMode ? "Remover comparação" : "Comparar com outro jogador"}
        </button>

        {compareMode && (
          <Select value={playerBId} onValueChange={setPlayerBId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Selecionar segundo jogador" />
            </SelectTrigger>
            <SelectContent>
              {players.filter((p) => p.id !== playerAId).map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nickname || p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!playerAId && <p className="text-sm text-muted-foreground">Selecione um jogador para ver o Raio-X individual.</p>}

      <div className={compareMode && playerBId ? "grid md:grid-cols-2 gap-4" : ""}>
        {playerAId && playerA && <PlayerHealthCard player={playerA} health={healthA} />}
        {compareMode && playerBId && playerB && <PlayerHealthCard player={playerB} health={healthB} />}
      </div>
    </div>
  );
}

export function RaioX() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Raio-X
        </h1>
        <p className="text-muted-foreground text-sm">Saúde do grupo e de cada jogador, com base nos últimos 30 dias</p>
      </div>

      <Tabs defaultValue="team" className="w-full">
        <TabsList>
          <TabsTrigger value="team">Time</TabsTrigger>
          <TabsTrigger value="player">Jogador</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Raio-X do Grupo</CardTitle>
              <CardDescription>Comparecimento, confirmação e membros ativos do time</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamHealthPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="player" className="mt-4">
          <PlayerHealthPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
