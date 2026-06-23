import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  UserPlus,
  UserMinus,
  CheckCircle2,
  Clock3,
  XCircle,
  Pencil,
  Activity,
  Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTeams } from "@/hooks/useTeams";
import { useRealtime } from "@/hooks/useRealtime";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LogRow {
  id: string;
  action: string;
  resource_type: string;
  old_values: any;
  new_values: any;
  created_at: string;
  profile: { display_name: string | null } | null;
}

interface ActivityDescriptor {
  icon: React.ElementType;
  color: string;
  typeLabel: string;
  text: string;
}

function describeActivity(log: LogRow): ActivityDescriptor {
  const status = log.new_values?.status as string | undefined;

  if (log.resource_type === "game_participants") {
    if (log.action === "INSERT") {
      if (status === "waitlist") return { icon: Clock3, color: "text-amber-400", typeLabel: "Fila de espera", text: "entrou na fila de espera" };
      if (status === "confirmed") return { icon: CheckCircle2, color: "text-emerald-400", typeLabel: "Confirmação", text: "confirmou presença" };
      return { icon: UserPlus, color: "text-sky-400", typeLabel: "Convocação", text: "foi convocado para um jogo" };
    }
    if (log.action === "UPDATE") {
      if (status === "checked_in") return { icon: CheckCircle2, color: "text-emerald-400", typeLabel: "Check-in", text: "fez check-in no jogo" };
      if (status === "confirmed" && log.old_values?.status === "waitlist") return { icon: CheckCircle2, color: "text-emerald-400", typeLabel: "Fila de espera", text: "foi aprovado da fila de espera" };
      if (status === "absent") return { icon: XCircle, color: "text-red-400", typeLabel: "Ausência", text: "foi marcado como ausente" };
      return { icon: Pencil, color: "text-sky-400", typeLabel: "Atualização", text: "teve a participação atualizada" };
    }
    return { icon: UserMinus, color: "text-red-400", typeLabel: "Remoção", text: "saiu da lista do jogo" };
  }

  if (log.resource_type === "games") {
    if (log.action === "INSERT") return { icon: Calendar, color: "text-sky-400", typeLabel: "Jogo criado", text: `criou o jogo "${log.new_values?.title || ""}"` };
    if (log.action === "DELETE") return { icon: Calendar, color: "text-red-400", typeLabel: "Jogo removido", text: `removeu o jogo "${log.old_values?.title || ""}"` };
    return { icon: Pencil, color: "text-amber-400", typeLabel: "Jogo atualizado", text: `atualizou o jogo "${log.new_values?.title || ""}"` };
  }

  if (log.resource_type === "players") {
    if (log.action === "INSERT") return { icon: UserPlus, color: "text-emerald-400", typeLabel: "Jogador adicionado", text: "entrou no time" };
    if (log.action === "DELETE") return { icon: UserMinus, color: "text-red-400", typeLabel: "Jogador removido", text: "foi removido do time" };
    return { icon: Pencil, color: "text-amber-400", typeLabel: "Perfil atualizado", text: "atualizou o perfil de jogador" };
  }

  if (log.resource_type === "team_members") {
    if (log.action === "INSERT") return { icon: UserPlus, color: "text-emerald-400", typeLabel: "Membro adicionado", text: "entrou para o time" };
    if (log.action === "DELETE") return { icon: UserMinus, color: "text-red-400", typeLabel: "Membro removido", text: "saiu do time" };
    return { icon: Pencil, color: "text-amber-400", typeLabel: "Papel atualizado", text: "teve seu papel atualizado" };
  }

  if (log.action === "REMOVE_PLAYER") {
    return { icon: UserMinus, color: "text-red-400", typeLabel: "Jogador removido", text: "removeu um jogador do time" };
  }

  return { icon: Activity, color: "text-muted-foreground", typeLabel: "Outro", text: `${log.action} em ${log.resource_type}` };
}

export function ActivityLog() {
  const { activeTeam } = useTeams();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [personFilter, setPersonFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = useCallback(async () => {
    if (!activeTeam?.id) return;
    setLoading(true);
    let query = supabase
      .from("audit_logs")
      .select(`id, action, resource_type, old_values, new_values, created_at, profile:profiles(display_name)`)
      .eq("team_id", activeTeam.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
    if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);

    const { data } = await query;
    setLogs((data as unknown as LogRow[]) || []);
    setLoading(false);
  }, [activeTeam?.id, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useRealtime({
    table: "audit_logs",
    filter: activeTeam?.id ? `team_id=eq.${activeTeam.id}` : undefined,
    enabled: !!activeTeam?.id,
    onEvent: fetchLogs,
  });

  const enriched = useMemo(() => logs.map((log) => ({ log, info: describeActivity(log) })), [logs]);

  const people = useMemo(() => {
    const names = new Set<string>();
    enriched.forEach(({ log }) => { if (log.profile?.display_name) names.add(log.profile.display_name); });
    return Array.from(names);
  }, [enriched]);

  const types = useMemo(() => {
    const labels = new Set<string>();
    enriched.forEach(({ info }) => labels.add(info.typeLabel));
    return Array.from(labels);
  }, [enriched]);

  const filtered = enriched.filter(({ log, info }) => {
    if (personFilter !== "all" && log.profile?.display_name !== personFilter) return false;
    if (typeFilter !== "all" && info.typeLabel !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Log de Atividades
        </h1>
        <p className="text-muted-foreground text-sm">Tudo que aconteceu no time, em ordem cronológica</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Pessoa</Label>
          <Select value={personFilter} onValueChange={setPersonFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {people.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">De</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Nenhuma atividade encontrada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(({ log, info }) => {
                const Icon = info.icon;
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/40 transition-colors">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${info.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{log.profile?.display_name || "Alguém"}</span>
                        <span className="text-sm text-muted-foreground">{info.text}</span>
                        <Badge variant="outline" className="text-[10px]">{info.typeLabel}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
