import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTeams } from "@/hooks/useTeams";
import { Check, X, Loader2, Gavel } from "lucide-react";

interface Dispute {
  id: string;
  stat_field: string;
  current_value: number;
  requested_value: number;
  reason: string | null;
  created_at: string;
  players: { name: string; nickname: string } | null;
}

const STAT_FIELD_LABELS: Record<string, string> = {
  goals: "Gols",
  assists: "Assistências",
  yellow_cards: "Cartões Amarelos",
  red_cards: "Cartões Vermelhos",
  saves: "Defesas",
  tackles: "Desarmes",
  fouls: "Faltas",
};

export function StatDisputes() {
  const { activeTeam } = useTeams();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    if (!activeTeam?.id) return;
    const { data } = await supabase
      .from("player_stat_disputes")
      .select("id, stat_field, current_value, requested_value, reason, created_at, player_id, players:player_id(name, nickname)")
      .eq("team_id", activeTeam.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setDisputes((data as any) || []);
    setLoading(false);
  }, [activeTeam?.id]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const handleApprove = async (id: string) => {
    setActingId(id);
    try {
      const { error } = await supabase.rpc("approve_stat_dispute", { p_dispute_id: id });
      if (error) throw error;
      toast({ title: "Contestação aprovada", description: "A estatística foi atualizada." });
      await fetchDisputes();
    } catch (err: any) {
      toast({ title: "Erro ao aprovar", description: err.message, variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActingId(id);
    try {
      const { error } = await supabase.rpc("reject_stat_dispute", { p_dispute_id: id });
      if (error) throw error;
      toast({ title: "Contestação rejeitada" });
      await fetchDisputes();
    } catch (err: any) {
      toast({ title: "Erro ao rejeitar", description: err.message, variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  if (disputes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Gavel className="h-4 w-4" />
        Nenhuma contestação pendente.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {disputes.map((dispute) => (
        <Card key={dispute.id}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {dispute.players?.name} ({dispute.players?.nickname})
              </p>
              <p className="text-xs text-muted-foreground">
                {STAT_FIELD_LABELS[dispute.stat_field] || dispute.stat_field}: {dispute.current_value} → <Badge variant="outline" className="ml-1">{dispute.requested_value}</Badge>
              </p>
              {dispute.reason && (
                <p className="text-xs text-muted-foreground mt-1 italic">"{dispute.reason}"</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                disabled={actingId === dispute.id}
                onClick={() => handleApprove(dispute.id)}
                aria-label="Aprovar"
              >
                {actingId === dispute.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button
                size="sm" variant="outline" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                disabled={actingId === dispute.id}
                onClick={() => handleReject(dispute.id)}
                aria-label="Rejeitar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
