import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Beef, Bell, Users, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { useToast } from "@/hooks/use-toast";

interface BBQItem {
  id: string;
  item_name: string;
  responsible_player_id: string | null;
  estimated_cost: number;
  brought: boolean;
  players?: { name: string; nickname: string } | null;
}

interface BBQ {
  id: string;
  restrict_to_monthly: boolean;
}

interface Summary {
  total_cost: number;
  confirmed_count: number;
  cost_per_person: number | null;
}

export function GameBBQ({ gameId, isAdmin }: { gameId: string; isAdmin: boolean }) {
  const { profile } = useAuth();
  const { activeTeam } = useTeams();
  const { toast } = useToast();
  const [bbq, setBbq] = useState<BBQ | null>(null);
  const [items, setItems] = useState<BBQItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCost, setNewItemCost] = useState("");

  const fetchAll = useCallback(async () => {
    if (!gameId || !activeTeam?.id) return;
    setLoading(true);

    const { data: bbqRow } = await supabase
      .from("game_bbqs")
      .select("id, restrict_to_monthly")
      .eq("game_id", gameId)
      .maybeSingle();

    if (!bbqRow) {
      setBbq(null);
      setLoading(false);
      return;
    }
    setBbq(bbqRow as BBQ);

    // Não-admins não podem SELECT direto em "players" (RLS restringe a admins
    // desde a migration 20251121012121) — usamos get_team_players(), que é
    // SECURITY DEFINER e devolve a lista completa do time, para resolver
    // tanto o nome do responsável por item quanto o player_id do usuário atual.
    const [{ data: itemsData }, { data: summaryData }, { data: teamPlayers }] = await Promise.all([
      supabase.from("bbq_items").select("id, item_name, responsible_player_id, estimated_cost, brought").eq("bbq_id", bbqRow.id).order("created_at"),
      supabase.rpc("get_bbq_summary", { p_bbq_id: bbqRow.id }),
      supabase.rpc("get_team_players", { _team_id: activeTeam.id }),
    ]);

    const playersById = new Map((teamPlayers as any[] | null)?.map((p) => [p.id, p]) || []);
    setItems(((itemsData as any[]) || []).map((item) => ({
      ...item,
      players: item.responsible_player_id ? playersById.get(item.responsible_player_id) || null : null,
    })));
    setSummary(summaryData as unknown as Summary);

    if (profile?.id) {
      const myPlayer = (teamPlayers as any[] | null)?.find((p) => p.profile_id === profile.id);
      if (myPlayer) {
        setMyPlayerId(myPlayer.id);
        const { data: confirmRow } = await supabase
          .from("bbq_confirmations")
          .select("id")
          .eq("bbq_id", bbqRow.id)
          .eq("player_id", myPlayer.id)
          .maybeSingle();
        setConfirmed(!!confirmRow);
      }
    }

    setLoading(false);
  }, [gameId, activeTeam?.id, profile?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleEnableBBQ = async (restrict: boolean) => {
    const { error } = await supabase.rpc("upsert_game_bbq", { p_game_id: gameId, p_restrict_to_monthly: restrict });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    await fetchAll();
  };

  const handleAddItem = async () => {
    if (!bbq || !newItemName.trim()) return;
    const { error } = await supabase.from("bbq_items").insert({
      bbq_id: bbq.id,
      item_name: newItemName.trim(),
      responsible_player_id: myPlayerId,
      estimated_cost: newItemCost ? parseFloat(newItemCost) : 0,
    });
    if (error) { toast({ title: "Erro ao adicionar item", description: error.message, variant: "destructive" }); return; }
    setNewItemName("");
    setNewItemCost("");
    await fetchAll();
  };

  const handleToggleBrought = async (item: BBQItem) => {
    await supabase.from("bbq_items").update({ brought: !item.brought }).eq("id", item.id);
    await fetchAll();
  };

  const handleDeleteItem = async (itemId: string) => {
    await supabase.from("bbq_items").delete().eq("id", itemId);
    await fetchAll();
  };

  const handleToggleConfirm = async () => {
    if (!bbq || !myPlayerId) return;
    if (confirmed) {
      await supabase.from("bbq_confirmations").delete().eq("bbq_id", bbq.id).eq("player_id", myPlayerId);
    } else {
      const { error } = await supabase.from("bbq_confirmations").insert({ bbq_id: bbq.id, player_id: myPlayerId });
      if (error) { toast({ title: "Erro ao confirmar", description: error.message, variant: "destructive" }); return; }
    }
    await fetchAll();
  };

  const handleSendReminder = async () => {
    if (!bbq) return;
    const { error } = await supabase.rpc("send_bbq_reminder", { p_bbq_id: bbq.id });
    if (error) { toast({ title: "Erro ao enviar lembrete", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Lembrete enviado!" });
  };

  if (loading) return null;

  if (!bbq) {
    if (!isAdmin) return null;
    return (
      <Card className="mt-6">
        <CardContent className="pt-6 text-center">
          <Beef className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-3">Nenhum churrasco organizado para este jogo.</p>
          <Button size="sm" onClick={() => handleEnableBBQ(false)}>Organizar churrasco</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Beef className="h-5 w-5 text-orange-500" />
          Churrasco
          {bbq.restrict_to_monthly && <Badge variant="outline">Só mensalistas</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Switch id="restrict-monthly" checked={bbq.restrict_to_monthly} onCheckedChange={(v) => handleEnableBBQ(v)} />
            <Label htmlFor="restrict-monthly" className="text-sm">Restringir a mensalistas</Label>
          </div>
        )}

        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item adicionado ainda.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 p-2 rounded-md border">
                <Checkbox checked={item.brought} onCheckedChange={() => handleToggleBrought(item)} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${item.brought ? "line-through text-muted-foreground" : ""}`}>
                    {item.item_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.players?.nickname || "sem responsável"} · R$ {item.estimated_cost.toFixed(2)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Input placeholder="Novo item (ex: Carvão)" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
          <Input
            placeholder="R$"
            type="number"
            min="0"
            step="0.01"
            value={newItemCost}
            onChange={(e) => setNewItemCost(e.target.value)}
            className="w-24"
          />
          <Button onClick={handleAddItem} disabled={!newItemName.trim()}>Adicionar</Button>
        </div>

        {summary && (
          <div className="flex items-center justify-around text-center pt-2 border-t">
            <div>
              <div className="text-sm font-bold">R$ {summary.total_cost.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Custo total</div>
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1 justify-center">
                <Users className="h-3 w-3" /> {summary.confirmed_count}
              </div>
              <div className="text-xs text-muted-foreground">Confirmados</div>
            </div>
            <div>
              <div className="text-sm font-bold">
                {summary.cost_per_person != null ? `R$ ${summary.cost_per_person.toFixed(2)}` : "—"}
              </div>
              <div className="text-xs text-muted-foreground">Por pessoa</div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {myPlayerId && (
            <Button variant={confirmed ? "outline" : "default"} className="flex-1" onClick={handleToggleConfirm}>
              {confirmed ? "Cancelar confirmação" : "Confirmar presença no churrasco"}
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" onClick={handleSendReminder} className="gap-2">
              <Bell className="h-4 w-4" />
              Enviar lembrete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
