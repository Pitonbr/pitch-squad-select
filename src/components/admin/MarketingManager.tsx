// ============================================================
// src/components/admin/MarketingManager.tsx
// Painel de marketing do master admin
// Campanhas e mensagens para todos os usuários
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { Label }   from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge }   from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Megaphone, Users, ShieldCheck } from "lucide-react";

interface Broadcast {
  id:         string;
  title:      string;
  message:    string;
  target:     string;
  sent_at:    string | null;
  created_at: string;
}

const TARGET_LABELS: Record<string, string> = {
  all:     "Todos os usuários",
  admins:  "Apenas admins de time",
  players: "Apenas jogadores",
};

export function MarketingManager() {
  const { user }  = useAuth();
  const { toast } = useToast();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading,   setLoading]     = useState(true);
  const [sending,   setSending]     = useState(false);
  const [stats,     setStats]       = useState({ teams: 0, users: 0 });

  const [title,   setTitle]   = useState("");
  const [message, setMessage] = useState("");
  const [target,  setTarget]  = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [bcastRes, teamsRes, usersRes] = await Promise.all([
      supabase.from("admin_broadcasts").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("teams").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    setBroadcasts((bcastRes.data as Broadcast[]) ?? []);
    setStats({ teams: teamsRes.count ?? 0, users: usersRes.count ?? 0 });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Preencha título e mensagem", variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("admin_broadcasts").insert({
      title:      title.trim(),
      message:    message.trim(),
      target,
      sent_at:    new Date().toISOString(),
      created_by: user?.id,
    });

    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } else {
      // Trigger broadcast via edge function
      await supabase.functions.invoke("send-team-broadcast", {
        body: { title: title.trim(), message: message.trim(), target, broadcast: true },
      }).catch(() => {});

      toast({ title: "Campanha enviada!", description: `Mensagem enviada para: ${TARGET_LABELS[target]}` });
      setTitle("");
      setMessage("");
      load();
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.users}</p>
              <p className="text-xs text-muted-foreground">Usuários cadastrados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.teams}</p>
              <p className="text-xs text-muted-foreground">Times ativos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New campaign */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Nova Campanha / Mensagem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Destino</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                <SelectItem value="admins">Apenas admins de time</SelectItem>
                <SelectItem value="players">Apenas jogadores</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Título da mensagem</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Novidade Soccer Squad!"
              className="text-sm"
              maxLength={100}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Mensagem</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Escreva sua mensagem ou campanha aqui..."
              className="text-sm min-h-[100px]"
              maxLength={500}
            />
            <p className="text-right text-xs text-muted-foreground">{message.length}/500</p>
          </div>
          <Button onClick={send} disabled={sending} className="w-full gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar para {TARGET_LABELS[target]}
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Histórico de campanhas</p>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : broadcasts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma campanha enviada ainda.</p>
        ) : (
          <div className="space-y-2">
            {broadcasts.map(b => (
              <div key={b.id} className="p-3 rounded-lg bg-card border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{b.title}</p>
                  <Badge variant="outline" className="text-[10px]">{TARGET_LABELS[b.target] ?? b.target}</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{b.message}</p>
                <p className="text-[10px] text-muted-foreground">
                  {b.sent_at ? new Date(b.sent_at).toLocaleString("pt-BR") : "Pendente"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
