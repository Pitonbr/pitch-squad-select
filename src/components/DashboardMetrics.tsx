// ============================================================
// src/components/DashboardMetrics.tsx  — FASE 3
// Faixa de métricas rápidas no topo do Dashboard:
//   - Próxima partida + countdown
//   - Jogadores confirmados / pendentes / total
//   - Botão de ação rápida "Convocar"
// Usa dados reais do Supabase via hooks já existentes.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useTeams } from "@/hooks/useTeams";
import { Calendar, Users, CheckCircle, Clock, MapPin, ChevronRight, Zap } from "lucide-react";
import { formatDistanceToNow, format, isPast, differenceInHours, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NextGame {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: string;
  confirmed: number;
  invited: number;
}

interface DashboardMetricsProps {
  onNavigate?: (view: string) => void;
}

export function DashboardMetrics({ onNavigate }: DashboardMetricsProps) {
  const { activeTeam } = useTeams();
  const [loading, setLoading] = useState(true);
  const [nextGame, setNextGame] = useState<NextGame | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [countdown, setCountdown] = useState("");

  const fetchMetrics = useCallback(async () => {
    if (!activeTeam) return;
    setLoading(true);
    try {
      // Próximo jogo
      const { data: games } = await supabase
        .from("games")
        .select("id, title, date, time, location, status, game_participants(status)")
        .eq("team_id", activeTeam.id)
        .in("status", ["scheduled", "checkin", "upcoming"])
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(1);

      if (games && games.length > 0) {
        const g = games[0];
        const participants = (g.game_participants as any[]) || [];
        setNextGame({
          id: g.id, title: g.title, date: g.date, time: g.time,
          location: g.location, status: g.status,
          confirmed: participants.filter(p => p.status === "confirmed").length,
          invited: participants.length,
        });
      } else {
        setNextGame(null);
      }

      // Total de jogadores
      const { count } = await supabase
        .from("players")
        .select("id", { count: "exact", head: true })
        .eq("team_id", activeTeam.id);
      setTotalPlayers(count || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTeam]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  // Countdown ticker
  useEffect(() => {
    if (!nextGame) return;
    const tick = () => {
      const gameDate = new Date(`${nextGame.date}T${nextGame.time}`);
      if (isPast(gameDate)) { setCountdown("Jogo iniciado!"); return; }
      const hrs = differenceInHours(gameDate, new Date());
      const mins = differenceInMinutes(gameDate, new Date()) % 60;
      if (hrs > 48) {
        setCountdown(formatDistanceToNow(gameDate, { locale: ptBR, addSuffix: false }));
      } else if (hrs > 0) {
        setCountdown(`${hrs}h ${mins}min`);
      } else {
        setCountdown(`${mins} min`);
      }
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [nextGame]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-7 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  const confirmed = nextGame?.confirmed ?? 0;
  const invited   = nextGame?.invited ?? 0;
  const pending   = invited - confirmed;

  return (
    <div className="mb-6 space-y-3">
      {/* Card da próxima partida — destaque */}
      {nextGame ? (
        <Card className="border-primary/25 bg-primary/5 hover:bg-primary/8 transition-colors cursor-pointer"
              onClick={() => onNavigate?.("games")}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">Próxima partida</p>
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary px-1.5 py-0">
                      {countdown}
                    </Badge>
                  </div>
                  <p className="font-semibold text-foreground truncate">{nextGame.title}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(`${nextGame.date}T00:00`), "dd/MM", { locale: ptBR })} às {nextGame.time.slice(0, 5)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                      <MapPin className="h-3 w-3 shrink-0" />{nextGame.location}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => onNavigate?.("games")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nenhum jogo agendado</p>
              <p className="text-xs text-muted-foreground/60">Clique para criar o próximo jogo</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardContent>
        </Card>
      )}

      {/* Faixa de métricas rápidas */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total de jogadores */}
        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => onNavigate?.("players")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Jogadores</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalPlayers}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">no plantel</p>
          </CardContent>
        </Card>

        {/* Confirmados para o próximo jogo */}
        <Card className={`transition-colors ${confirmed > 0 ? "border-green-500/25 bg-green-500/5" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className={`h-4 w-4 ${confirmed > 0 ? "text-green-500" : "text-muted-foreground"}`} />
              <span className="text-xs text-muted-foreground">Confirmados</span>
            </div>
            <p className={`text-2xl font-bold ${confirmed > 0 ? "text-green-500" : "text-foreground"}`}>{confirmed}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {invited > 0 ? `de ${invited} convocados` : "próximo jogo"}
            </p>
          </CardContent>
        </Card>

        {/* Pendentes */}
        <Card className={`transition-colors ${pending > 0 ? "border-amber-500/25 bg-amber-500/5" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className={`h-4 w-4 ${pending > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
              <span className="text-xs text-muted-foreground">Pendentes</span>
            </div>
            <p className={`text-2xl font-bold ${pending > 0 ? "text-amber-500" : "text-foreground"}`}>{pending}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">aguardando resp.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
