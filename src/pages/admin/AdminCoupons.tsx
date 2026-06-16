import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Percent, Clock, Gift } from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────
interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  type: string;
  value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  stripe_coupon_id: string | null;
  stripe_promo_id: string | null;
  created_at: string;
}

interface CouponStats {
  total_codes: number;
  active_codes: number;
  total_uses: number;
  expired_codes: number;
}

// ── Helpers ──────────────────────────────────────────────────
async function callEdgeFunction(body: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-stripe-coupon`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Erro na operação");
  return json;
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function isExpired(expires_at: string | null) {
  return expires_at ? new Date(expires_at) < new Date() : false;
}

// ── KPI card ─────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: number; icon: React.ElementType; accent: string;
}) {
  const colors: Record<string, string> = {
    purple:  "text-purple-400 bg-purple-500/10 border-purple-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    cyan:    "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    red:     "text-red-400 bg-red-500/10 border-red-500/20",
  };
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${colors[accent]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Create Dialog ─────────────────────────────────────────────
function CreateCouponDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    code:        "",
    description: "",
    type:        "discount_percent" as "discount_percent" | "free_trial",
    value:       "",
    max_uses:    "",
    expires_at:  "",
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.code.trim() || !form.value) return;
    setLoading(true);
    try {
      await callEdgeFunction({
        action:      "create",
        code:        form.code.trim(),
        description: form.description.trim() || undefined,
        type:        form.type,
        value:       Number(form.value),
        max_uses:    form.max_uses ? Number(form.max_uses) : undefined,
        expires_at:  form.expires_at || undefined,
      });
      qc.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      qc.invalidateQueries({ queryKey: ["admin-coupon-stats"] });
      toast.success(
        form.type === "discount_percent"
          ? `Cupom "${form.code.toUpperCase()}" criado no Stripe!`
          : `Cupom "${form.code.toUpperCase()}" criado!`,
      );
      setForm({ code: "", description: "", type: "discount_percent", value: "", max_uses: "", expires_at: "" });
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar cupom");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-purple-400" />
            Novo Cupom
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Código</label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="EX: PROMO20"
                className="bg-slate-800 border-slate-700 text-white font-mono"
                maxLength={30}
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Tipo</label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as "discount_percent" | "free_trial" })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="discount_percent" className="text-white">
                    % Desconto (Stripe)
                  </SelectItem>
                  <SelectItem value="free_trial" className="text-white">
                    Trial grátis (dias)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Descrição (opcional)</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Lançamento — 20% off no primeiro mês"
              className="bg-slate-800 border-slate-700 text-white"
              maxLength={120}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">
                {form.type === "discount_percent" ? "Percentual (%)" : "Dias de trial"}
              </label>
              <Input
                type="number"
                min={1}
                max={form.type === "discount_percent" ? 100 : undefined}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === "discount_percent" ? "20" : "30"}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Usos máx.</label>
              <Input
                type="number"
                min={1}
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                placeholder="∞"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Expira em</label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          {form.type === "discount_percent" && (
            <p className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700 rounded-lg p-3">
              Um cupom Stripe com <strong className="text-slate-300">{form.value || "X"}% de desconto</strong> será criado
              automaticamente. O código pode ser usado diretamente no checkout do Stripe.
            </p>
          )}
          {form.type === "free_trial" && (
            <p className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700 rounded-lg p-3">
              O cupom será registrado internamente. A extensão do trial é aplicada no momento da ativação da assinatura.
            </p>
          )}
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
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={!form.code.trim() || !form.value || loading}
            onClick={handleCreate}
          >
            {loading ? "Criando…" : "Criar cupom"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminCoupons() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: codes = [], isLoading } = useQuery<PromoCode[]>({
    queryKey: ["admin-promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_promo_codes");
      if (error) throw error;
      return (data ?? []) as PromoCode[];
    },
  });

  const { data: stats } = useQuery<CouponStats>({
    queryKey: ["admin-coupon-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_coupon_stats");
      if (error) throw error;
      return data as unknown as CouponStats;
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await callEdgeFunction({ action: "toggle", id, is_active });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      qc.invalidateQueries({ queryKey: ["admin-coupon-stats"] });
      toast.success("Cupom atualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await callEdgeFunction({ action: "delete", id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      qc.invalidateQueries({ queryKey: ["admin-coupon-stats"] });
      toast.success("Cupom removido");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="h-6 w-6 text-purple-400" />
            Cupons & Promoções
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gerencie cupons de desconto integrados ao Stripe e trials gratuitos
          </p>
        </div>
        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo cupom
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total de cupons"  value={stats?.total_codes  ?? 0} icon={Tag}     accent="purple" />
        <StatCard label="Cupons ativos"    value={stats?.active_codes ?? 0} icon={Gift}    accent="emerald" />
        <StatCard label="Usos totais"      value={stats?.total_uses   ?? 0} icon={Percent} accent="cyan" />
        <StatCard label="Expirados"        value={stats?.expired_codes ?? 0} icon={Clock}  accent="red" />
      </div>

      {/* Coupon list */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-purple-400" />
            Todos os Cupons
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full bg-slate-800" />)}
            </div>
          ) : codes.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Nenhum cupom criado ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {codes.map((c) => {
                const expired  = isExpired(c.expires_at);
                const inactive = !c.is_active || expired;
                return (
                  <div
                    key={c.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-opacity ${
                      inactive
                        ? "bg-slate-800/20 border-slate-800 opacity-60"
                        : "bg-slate-800/60 border-slate-700"
                    }`}
                  >
                    {/* Code + badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-white tracking-wider">
                          {c.code}
                        </span>
                        {c.type === "discount_percent" ? (
                          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">
                            <Percent className="h-2.5 w-2.5 mr-0.5" />
                            {c.value}% off
                          </Badge>
                        ) : (
                          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs">
                            <Gift className="h-2.5 w-2.5 mr-0.5" />
                            {c.value}d trial
                          </Badge>
                        )}
                        {c.stripe_coupon_id && (
                          <Badge className="bg-slate-700 text-slate-400 border-slate-600 text-xs">
                            Stripe
                          </Badge>
                        )}
                        {expired && (
                          <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">
                            Expirado
                          </Badge>
                        )}
                        {!expired && !c.is_active && (
                          <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20 text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      {c.description && (
                        <p className="text-slate-400 text-xs mt-0.5 truncate">{c.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-slate-500 text-xs flex-wrap">
                        <span>{c.used_count} uso{c.used_count !== 1 ? "s" : ""}{c.max_uses ? ` / ${c.max_uses} máx.` : ""}</span>
                        {c.expires_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(c.expires_at)}
                          </span>
                        )}
                        <span>{formatDate(c.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!expired && (
                        <button
                          onClick={() => toggle.mutate({ id: c.id, is_active: !c.is_active })}
                          disabled={toggle.isPending}
                          className="text-slate-400 hover:text-emerald-400 transition-colors"
                          title={c.is_active ? "Desativar" : "Ativar"}
                        >
                          {c.is_active
                            ? <ToggleRight className="h-5 w-5 text-emerald-400" />
                            : <ToggleLeft className="h-5 w-5" />}
                        </button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => remove.mutate(c.id)}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCouponDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
