import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitialsAvatar } from "@/lib/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, Check, X, Loader2 } from "lucide-react";

interface WaitlistEntry {
  id: string;
  waitlist_position: number | null;
  waitlist_reason: string | null;
  slot_type: string | null;
  players: { id: string; name: string; nickname: string; profile_image?: string } | null;
}

interface GameWaitlistProps {
  gameId: string;
  onChange?: () => void;
}

export function GameWaitlist({ gameId, onChange }: GameWaitlistProps) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchWaitlist = useCallback(async () => {
    const { data } = await supabase
      .from("game_participants")
      .select("id, waitlist_position, waitlist_reason, slot_type, players(id, name, nickname, profile_image)")
      .eq("game_id", gameId)
      .eq("status", "waitlist")
      .order("waitlist_position", { ascending: true });
    setEntries((data as any) || []);
    setLoading(false);
  }, [gameId]);

  useEffect(() => { fetchWaitlist(); }, [fetchWaitlist]);

  const handleApprove = async (id: string) => {
    setActingId(id);
    try {
      const { error } = await supabase.rpc("approve_waitlist_participant", { _participant_id: id });
      if (error) throw error;
      toast({ title: "Jogador aprovado!", description: "Ele foi movido para a lista de confirmados." });
      await fetchWaitlist();
      onChange?.();
    } catch (err: any) {
      toast({ title: "Erro ao aprovar", description: err.message, variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActingId(id);
    try {
      const { error } = await supabase.rpc("reject_waitlist_participant", { _participant_id: id });
      if (error) throw error;
      toast({ title: "Jogador removido da fila" });
      await fetchWaitlist();
      onChange?.();
    } catch (err: any) {
      toast({ title: "Erro ao rejeitar", description: err.message, variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  if (loading) return null;
  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-amber-500" />
          Fila de Espera
          <Badge variant="outline">{entries.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map(entry => (
          <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <span className="text-xs font-bold text-muted-foreground w-5 text-center">{entry.waitlist_position}º</span>
            <Avatar className="h-9 w-9">
              <AvatarImage src={entry.players?.profile_image || getInitialsAvatar(entry.players?.name || "?")} />
              <AvatarFallback>{entry.players?.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{entry.players?.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {entry.slot_type === "goalkeeper" ? "🧤 Goleiro" : "👤 Linha"} · {entry.waitlist_reason}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                disabled={actingId === entry.id}
                onClick={() => handleApprove(entry.id)}
                aria-label="Aprovar"
              >
                {actingId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button
                size="sm" variant="outline" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                disabled={actingId === entry.id}
                onClick={() => handleReject(entry.id)}
                aria-label="Rejeitar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
