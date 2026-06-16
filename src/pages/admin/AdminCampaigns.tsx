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
  TrendingUp, Plus, Play, Pause, Trash2, Send, Users, Clock,
  CheckCircle, AlertCircle, Mail, Layers,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────
interface AudienceFilter {
  segment: string;
  days?: number;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  audience_filter: AudienceFilter;
  subject: string;
  message: string;
  cta_url: string | null;
  cta_text: string | null;
  starts_at: string | null;
  ends_at: string | null;
  sent_count: number;
  click_count: number;
  launched_at: string | null;
  created_at: string;
}

interface CampaignStats {
  total: number;
  active: number;
  completed: number;
  total_sent: number;
}

// ── Segment definitions ───────────────────────────────────────
const SEGMENTS = [
  { value: "all",                 label: "Todos os usuários",            hint: "" },
  { value: "admins",              label: "Admins de times",              hint: "" },
  { value: "players",             label: "Jogadores",                    hint: "" },
  { value: "subscription_active", label: "Assinatura ativa (pagante)",   hint: "" },
  { value: "trial",               label: "Em período de trial",          hint: "" },
  { value: "new_days",            label: "Novos usuários (últimos N dias)", hint: "Informe quantos dias" },
  { value: "inactive_days",       label: "Inativos há mais de N dias",   hint: "Informe quantos dias" },
];

// ── Status badge ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    draft:     { label: "Rascunho",  cls: "bg-slate-500/10 text-slate-400 border-slate-500/20",    icon: Layers },
    scheduled: { label: "Agendada",  cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",       icon: Clock },
    running:   { label: "Executando",cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",    icon: Play },
    paused:    { label: "Pausada",   cls: "bg-orange-500/10 text-orange-400 border-orange-500/20", icon: Pause },
    completed: { label: "Concluída", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle },
    failed:    { label: "Falhou",    cls: "bg-red-500/10 text-red-400 border-red-500/20",          icon: AlertCircle },
  };
  const s = map[status] ?? map.draft;
  const Icon = s.icon;
  return (
    <Badge className={`text-xs flex items-center gap-1 ${s.cls}`}>
      <Icon className="h-2.5 w-2.5" />
      {s.label}
    </Badge>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: number; icon: React.ElementType; accent: string;
}) {
  const colors: Record<string, string> = {
    amber:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    cyan:    "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    blue:    "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
          </div>
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${colors[accent]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Create/Edit Campaign Dialog ───────────────────────────────
function CampaignDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    name:       "",
    description:"",
    type:       "email" as "email" | "banner" | "both",
    segment:    "all",
    days:       "30",
    subject:    "",
    message:    "",
    cta_url:    "",
    cta_text:   "",
    starts_at:  "",
    ends_at:    "",
  });
  const [saving, setSaving] = useState(false);

  const needsDays = ["new_days", "inactive_days"].includes(form.segment);

  const save = async (launch: boolean) => {
    if (!form.name.trim() || !form.subject.trim() || !form.message.trim()) return;
    setSaving(true);
    try {
      const audienceFilter: AudienceFilter = { segment: form.segment };
      if (needsDays) audienceFilter.days = Number(form.days);

      const { error } = await supabase.from("admin_campaigns").insert({
        name:            form.name.trim(),
        description:     form.description.trim() || null,
        type:            form.type,
        status:          launch ? "running" : form.starts_at ? "scheduled" : "draft",
        audience_filter: audienceFilter,
        subject:         form.subject.trim(),
        message:         form.message.trim(),
        cta_url:         form.cta_url.trim() || null,
        cta_text:        form.cta_text.trim() || null,
        starts_at:       form.starts_at || null,
        ends_at:         form.ends_at   || null,
        launched_at:     launch ? new Date().toISOString() : null,
      });
      if (error) throw error;

      qc.invalidateQueries({ queryKey: ["admin-campaigns"] });
      qc.invalidateQueries({ queryKey: ["admin-campaign-stats"] });
      toast.success(launch ? "Campanha iniciada!" : "Campanha salva!");
      onClose();
      setStep(1);
      setForm({ name:"",description:"",type:"email",segment:"all",days:"30",subject:"",message:"",cta_url:"",cta_text:"",starts_at:"",ends_at:"" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar campanha");
    } finally {
      setSaving(false);
    }
  };

  const segLabel = SEGMENTS.find((s) => s.value === form.segment)?.label ?? form.segment;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            Nova Campanha
            <span className="ml-auto text-slate-500 text-xs font-normal">Passo {step}/3</span>
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-amber-500" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Step 1 — Info geral */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Nome da campanha</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Reativação de inativos — Junho 2026"
                className="bg-slate-800 border-slate-700 text-white"
                maxLength={120}
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Descrição interna (opcional)</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Notas sobre objetivo, métricas esperadas…"
                className="bg-slate-800 border-slate-700 text-white"
                maxLength={200}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Tipo de envio</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "email" | "banner" | "both" })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="email"  className="text-white">E-mail</SelectItem>
                    <SelectItem value="banner" className="text-white">Banner in-app</SelectItem>
                    <SelectItem value="both"   className="text-white">E-mail + Banner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Segmento</label>
                <Select value={form.segment} onValueChange={(v) => setForm({ ...form, segment: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {SEGMENTS.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-white">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {needsDays && (
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">
                  {form.segment === "new_days" ? "Últimos quantos dias?" : "Inativo há quantos dias?"}
                </label>
                <Input
                  type="number"
                  min={1}
                  value={form.days}
                  onChange={(e) => setForm({ ...form, days: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white w-32"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Agendamento (início)</label>
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="bg-slate-800 border-slate-700 text-white text-xs" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Fim (opcional)</label>
                <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="bg-slate-800 border-slate-700 text-white text-xs" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Conteúdo */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Assunto do e-mail</label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Ex: Voltamos com novidades para você!"
                className="bg-slate-800 border-slate-700 text-white"
                maxLength={150}
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Mensagem</label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Corpo do e-mail ou conteúdo da campanha…"
                className="bg-slate-800 border-slate-700 text-white min-h-[140px] resize-none"
                maxLength={3000}
              />
              <p className="text-slate-600 text-xs mt-1 text-right">{form.message.length}/3000</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">URL do CTA (opcional)</label>
                <Input value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} placeholder="https://…" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Texto do botão</label>
                <Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} placeholder="Ver oferta" className="bg-slate-800 border-slate-700 text-white" maxLength={40} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Revisão */}
        {step === 3 && (
          <div className="space-y-3 py-2">
            <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Nome</span>
                <span className="text-white font-medium">{form.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tipo</span>
                <span className="text-white">{form.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Segmento</span>
                <span className="text-white">{segLabel}{needsDays ? ` (${form.days} dias)` : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assunto</span>
                <span className="text-white truncate max-w-[200px]">{form.subject}</span>
              </div>
              {form.starts_at && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Início</span>
                  <span className="text-white">{new Date(form.starts_at).toLocaleString("pt-BR")}</span>
                </div>
              )}
            </div>
            <p className="text-slate-500 text-xs text-center">
              Revise os dados acima. Ao lançar, os e-mails serão enviados imediatamente.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
              Voltar
            </Button>
          )}
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={onClose}>
            Cancelar
          </Button>
          {step < 3 ? (
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={step === 1 ? !form.name.trim() : !form.subject.trim() || !form.message.trim()}
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
            >
              Próximo
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                disabled={saving}
                onClick={() => save(false)}
              >
                {saving ? "Salvando…" : "Salvar rascunho"}
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={saving}
                onClick={() => save(true)}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {saving ? "Lançando…" : "Lançar agora"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminCampaigns() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [runningId,  setRunningId]  = useState<string | null>(null);

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_campaigns");
      if (error) throw error;
      return (data ?? []) as Campaign[];
    },
  });

  const { data: stats } = useQuery<CampaignStats>({
    queryKey: ["admin-campaign-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_campaign_stats");
      if (error) throw error;
      return data as unknown as CampaignStats;
    },
  });

  const launch = useMutation({
    mutationFn: async (id: string) => {
      setRunningId(id);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-run-campaign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ campaign_id: id }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao lançar");
      return json;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["admin-campaigns"] });
      qc.invalidateQueries({ queryKey: ["admin-campaign-stats"] });
      toast.success(`Campanha enviada para ${result.sent} destinatário(s)!`);
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setRunningId(null),
  });

  const togglePause = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "paused" ? "running" : "paused";
      const { error } = await supabase.from("admin_campaigns").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-campaigns"] }),
    onError: () => toast.error("Erro ao atualizar campanha"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-campaigns"] });
      qc.invalidateQueries({ queryKey: ["admin-campaign-stats"] });
      toast.success("Campanha removida");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const typeIcon = (t: string) => t === "email" ? Mail : t === "banner" ? Layers : TrendingUp;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-amber-400" />
            Campanhas de Marketing
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Segmente audiências e envie campanhas por e-mail com agendamento
          </p>
        </div>
        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nova campanha
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total"          value={stats?.total       ?? 0} icon={TrendingUp}  accent="amber" />
        <StatCard label="Ativas"         value={stats?.active      ?? 0} icon={Play}        accent="emerald" />
        <StatCard label="Concluídas"     value={stats?.completed   ?? 0} icon={CheckCircle} accent="cyan" />
        <StatCard label="E-mails enviados" value={stats?.total_sent ?? 0} icon={Send}        accent="blue" />
      </div>

      {/* Campaign list */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            Todas as Campanhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full bg-slate-800" />)}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-12 text-center">
              <TrendingUp className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Nenhuma campanha criada ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {campaigns.map((c) => {
                const TypeIcon = typeIcon(c.type);
                const segDef   = SEGMENTS.find((s) => s.value === c.audience_filter?.segment);
                const isRunnable = ["draft","scheduled","failed"].includes(c.status);
                const isPausable = ["running"].includes(c.status);
                return (
                  <div
                    key={c.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-opacity ${
                      c.status === "completed"
                        ? "bg-slate-800/20 border-slate-800 opacity-60"
                        : "bg-slate-800/60 border-slate-700"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <TypeIcon className="h-4 w-4 text-amber-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-slate-200 text-sm font-medium">{c.name}</p>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.description && (
                        <p className="text-slate-500 text-xs mt-0.5 truncate">{c.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-slate-500 text-xs flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {segDef?.label ?? c.audience_filter?.segment}
                          {c.audience_filter?.days ? ` (${c.audience_filter.days}d)` : ""}
                        </span>
                        {c.sent_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            {c.sent_count.toLocaleString()} enviados
                          </span>
                        )}
                        <span>{formatDate(c.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isRunnable && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2 text-xs"
                          disabled={runningId === c.id}
                          onClick={() => launch.mutate(c.id)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {runningId === c.id ? "Enviando…" : "Lançar"}
                        </Button>
                      )}
                      {isPausable && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 h-7 px-2 text-xs"
                          onClick={() => togglePause.mutate({ id: c.id, currentStatus: c.status })}
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Pausar
                        </Button>
                      )}
                      {c.status !== "running" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => remove.mutate(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CampaignDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
