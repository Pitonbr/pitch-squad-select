import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Megaphone, Plus, Send, Trash2, AlertTriangle, Info, CheckCircle,
  XCircle, Bell, Clock, Users,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────
interface Broadcast {
  id: string;
  title: string;
  message: string;
  target: string;
  channels: string[];
  status: string;
  recipient_count: number;
  sent_at: string | null;
  created_at: string;
}

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

// ── Status badge ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft:   { label: "Rascunho", cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
    sending: { label: "Enviando", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    sent:    { label: "Enviado",  cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    failed:  { label: "Falhou",   cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const s = map[status] ?? map.draft;
  return <Badge className={`text-xs ${s.cls}`}>{s.label}</Badge>;
}

// ── Alert type icon ──────────────────────────────────────────
function AlertIcon({ type, className }: { type: string; className?: string }) {
  const map: Record<string, React.ElementType> = {
    info:    Info,
    warning: AlertTriangle,
    error:   XCircle,
    success: CheckCircle,
  };
  const Icon = map[type] ?? Info;
  const colors: Record<string, string> = {
    info:    "text-blue-400",
    warning: "text-amber-400",
    error:   "text-red-400",
    success: "text-emerald-400",
  };
  return <Icon className={`${colors[type] ?? "text-blue-400"} ${className ?? "h-4 w-4"}`} />;
}

// ── Create Broadcast Dialog ───────────────────────────────────
function CreateBroadcastDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "", message: "", target: "all", channelEmail: true,
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("admin_broadcasts").insert({
        title:    form.title.trim(),
        message:  form.message.trim(),
        target:   form.target,
        channels: form.channelEmail ? ["email"] : [],
        status:   "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
      toast.success("Rascunho salvo!");
      setForm({ title: "", message: "", target: "all", channelEmail: true });
      onClose();
    },
    onError: () => toast.error("Erro ao criar comunicado"),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-cyan-400" />
            Novo Comunicado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Título</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Manutenção programada…"
              className="bg-slate-800 border-slate-700 text-white"
              maxLength={200}
            />
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Mensagem</label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Conteúdo do comunicado…"
              className="bg-slate-800 border-slate-700 text-white min-h-[120px] resize-none"
              maxLength={2000}
            />
            <p className="text-slate-600 text-xs mt-1 text-right">{form.message.length}/2000</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Destinatários</label>
              <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all"     className="text-white">Todos os usuários</SelectItem>
                  <SelectItem value="admins"  className="text-white">Admins de times</SelectItem>
                  <SelectItem value="players" className="text-white">Jogadores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Canal</label>
              <div className="flex items-center gap-2 h-10 px-3 bg-slate-800 border border-slate-700 rounded-md">
                <input
                  type="checkbox"
                  id="ch-email"
                  checked={form.channelEmail}
                  onChange={(e) => setForm({ ...form, channelEmail: e.target.checked })}
                  className="accent-emerald-500"
                />
                <label htmlFor="ch-email" className="text-slate-300 text-sm cursor-pointer">
                  E-mail
                </label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={!form.title.trim() || !form.message.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Salvando…" : "Salvar rascunho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Create System Alert Dialog ────────────────────────────────
function CreateAlertDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", message: "", type: "info" });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("system_alerts").insert({
        title:   form.title.trim(),
        message: form.message.trim(),
        type:    form.type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-system-alerts"] });
      qc.invalidateQueries({ queryKey: ["system-alerts-active"] });
      toast.success("Alerta criado e ativado!");
      setForm({ title: "", message: "", type: "info" });
      onClose();
    },
    onError: () => toast.error("Erro ao criar alerta"),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            Novo Alerta do Sistema
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Título</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Manutenção em andamento…"
              className="bg-slate-800 border-slate-700 text-white"
              maxLength={120}
            />
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Mensagem</label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Detalhes do alerta…"
              className="bg-slate-800 border-slate-700 text-white min-h-[90px] resize-none"
              maxLength={500}
            />
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Tipo</label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="info"    className="text-white">ℹ️  Informação</SelectItem>
                <SelectItem value="warning" className="text-white">⚠️  Aviso</SelectItem>
                <SelectItem value="error"   className="text-white">🚨  Erro / Urgente</SelectItem>
                <SelectItem value="success" className="text-white">✅  Sucesso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            disabled={!form.title.trim() || !form.message.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Criando…" : "Publicar alerta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminAnnouncements() {
  const qc = useQueryClient();
  const [showBroadcastDlg, setShowBroadcastDlg] = useState(false);
  const [showAlertDlg,     setShowAlertDlg]     = useState(false);
  const [sendingId,        setSendingId]         = useState<string | null>(null);

  const { data: broadcasts = [], isLoading: loadingBC } = useQuery<Broadcast[]>({
    queryKey: ["admin-broadcasts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_broadcasts", {
        p_limit: 50, p_offset: 0,
      });
      if (error) throw error;
      return (data ?? []) as Broadcast[];
    },
  });

  const { data: alerts = [], isLoading: loadingAl } = useQuery<SystemAlert[]>({
    queryKey: ["admin-system-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_system_alerts");
      if (error) throw error;
      return (data ?? []) as SystemAlert[];
    },
  });

  const sendBroadcast = useMutation({
    mutationFn: async (id: string) => {
      setSendingId(id);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-send-broadcast`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ broadcast_id: id }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao enviar");
      return json;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      toast.success(`Enviado para ${result.sent} destinatário(s)!`);
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setSendingId(null),
  });

  const deleteBroadcast = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_broadcasts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
      toast.success("Comunicado removido");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const toggleAlert = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("system_alerts")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-system-alerts"] });
      qc.invalidateQueries({ queryKey: ["system-alerts-active"] });
    },
    onError: () => toast.error("Erro ao atualizar alerta"),
  });

  const deleteAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("system_alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-system-alerts"] });
      qc.invalidateQueries({ queryKey: ["system-alerts-active"] });
    },
    onError: () => toast.error("Erro ao remover alerta"),
  });

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const targetLabel: Record<string, string> = {
    all: "Todos", admins: "Admins", players: "Jogadores",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-cyan-400" />
            Comunicados
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Comunicados por e-mail e alertas exibidos dentro do app
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            onClick={() => setShowAlertDlg(true)}
          >
            <Bell className="h-4 w-4 mr-1.5" />
            Novo alerta
          </Button>
          <Button
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
            onClick={() => setShowBroadcastDlg(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Novo comunicado
          </Button>
        </div>
      </div>

      {/* System Alerts */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-400" />
            Alertas do Sistema
            <Badge className="ml-auto bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
              {alerts.filter((a) => a.is_active).length} ativos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAl ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full bg-slate-800" />)}
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">Nenhum alerta criado.</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-opacity ${
                    a.is_active
                      ? "bg-slate-800/60 border-slate-700"
                      : "bg-slate-800/20 border-slate-800 opacity-50"
                  }`}
                >
                  <AlertIcon type={a.type} className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm font-medium">{a.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5 truncate">{a.message}</p>
                    <p className="text-slate-600 text-xs mt-1">{formatDate(a.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className={`text-xs h-7 px-2 ${
                        a.is_active
                          ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                          : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      }`}
                      onClick={() => toggleAlert.mutate({ id: a.id, is_active: !a.is_active })}
                      disabled={toggleAlert.isPending}
                    >
                      {a.is_active ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => deleteAlert.mutate(a.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Broadcasts */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-cyan-400" />
            Comunicados por E-mail
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBC ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full bg-slate-800" />)}
            </div>
          ) : broadcasts.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">
              Nenhum comunicado criado ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {broadcasts.map((b) => (
                <div
                  key={b.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/60 border border-slate-700"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-slate-200 text-sm font-medium">{b.title}</p>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-slate-400 text-xs mt-1 truncate">{b.message}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-slate-500 text-xs">
                        <Users className="h-3 w-3" />
                        {targetLabel[b.target] ?? b.target}
                        {b.recipient_count > 0 && ` · ${b.recipient_count} enviados`}
                      </span>
                      {b.sent_at ? (
                        <span className="flex items-center gap-1 text-slate-500 text-xs">
                          <Clock className="h-3 w-3" />
                          {formatDate(b.sent_at)}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">{formatDate(b.created_at)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {b.status === "draft" && (
                      <Button
                        size="sm"
                        className="bg-cyan-600 hover:bg-cyan-700 text-white h-7 px-2 text-xs"
                        disabled={sendingId === b.id}
                        onClick={() => sendBroadcast.mutate(b.id)}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        {sendingId === b.id ? "Enviando…" : "Enviar"}
                      </Button>
                    )}
                    {b.status !== "sending" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => deleteBroadcast.mutate(b.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateBroadcastDialog open={showBroadcastDlg} onClose={() => setShowBroadcastDlg(false)} />
      <CreateAlertDialog     open={showAlertDlg}     onClose={() => setShowAlertDlg(false)} />
    </div>
  );
}
