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
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Legend,
} from "recharts";
import {
  BarChart3, Plus, Trash2, TrendingUp, TrendingDown, DollarSign,
  Users, CreditCard, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────
interface MonthlyPoint {
  month: string;
  label: string;
  revenue_brl: number;
  costs_brl:   number;
  net_brl:     number;
}

interface RevenueSummary {
  total_revenue_brl:    number;
  revenue_30d_brl:      number;
  active_subscriptions: number;
  trialing_subscriptions: number;
  canceled_subscriptions: number;
  mrr_brl:              number;
  monthly_revenue:      { month: string; label: string; revenue_brl: number }[];
}

interface PLSummary {
  pl_by_month:      MonthlyPoint[];
  total_revenue_brl: number;
  total_costs_brl:   number;
}

interface CostEntry {
  id:           string;
  category:     string;
  description:  string;
  amount_brl:   number;
  period_month: string;
  created_at:   string;
}

const CATEGORIES = [
  { value: "infrastructure", label: "Infraestrutura" },
  { value: "marketing",      label: "Marketing" },
  { value: "tools",          label: "Ferramentas" },
  { value: "personnel",      label: "Pessoal" },
  { value: "other",          label: "Outros" },
];

const CATEGORY_COLORS: Record<string, string> = {
  infrastructure: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  marketing:      "bg-purple-500/10 text-purple-400 border-purple-500/20",
  tools:          "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  personnel:      "bg-amber-500/10 text-amber-400 border-amber-500/20",
  other:          "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, accent, loading }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; accent: string; loading?: boolean;
}) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue:    "text-blue-400 bg-blue-500/10 border-blue-500/20",
    cyan:    "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    amber:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
    red:     "text-red-400 bg-red-500/10 border-red-500/20",
    purple:  "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-slate-400 text-xs mb-2">{label}</p>
            {loading ? <Skeleton className="h-7 w-28 bg-slate-800" /> :
              <p className="text-2xl font-bold text-white">{value}</p>}
            {sub && !loading && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
          </div>
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${colors[accent]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Add Cost Dialog ───────────────────────────────────────────
function AddCostDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    category:    "infrastructure",
    description: "",
    amount_brl:  "",
    period_month: currentMonth(),
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.description.trim() || !form.amount_brl) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("admin_cost_entries").insert({
        category:     form.category,
        description:  form.description.trim(),
        amount_brl:   parseFloat(form.amount_brl),
        period_month: form.period_month,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["admin-cost-entries"] });
      qc.invalidateQueries({ queryKey: ["admin-pl-summary"] });
      toast.success("Custo lançado!");
      setForm({ category: "infrastructure", description: "", amount_brl: "", period_month: currentMonth() });
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-400" />
            Novo Lançamento de Custo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Categoria</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-white">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1.5 block">Competência (mês)</label>
              <Input
                type="month"
                value={form.period_month}
                onChange={(e) => setForm({ ...form, period_month: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Descrição</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Supabase Pro — Junho 2026"
              className="bg-slate-800 border-slate-700 text-white"
              maxLength={150}
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Valor (R$)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.amount_brl}
              onChange={(e) => setForm({ ...form, amount_brl: e.target.value })}
              placeholder="0,00"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={!form.description.trim() || !form.amount_brl || saving}
            onClick={handleSave}
          >
            {saving ? "Salvando…" : "Lançar custo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminFinancial() {
  const qc = useQueryClient();
  const [showAddCost, setShowAddCost] = useState(false);

  const { data: revenue, isLoading: loadingRev } = useQuery<RevenueSummary>({
    queryKey: ["admin-revenue-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_revenue_summary");
      if (error) throw error;
      return data as unknown as RevenueSummary;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: pl, isLoading: loadingPL } = useQuery<PLSummary>({
    queryKey: ["admin-pl-summary"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_pl_summary");
      if (error) throw error;
      return data as unknown as PLSummary;
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: costs = [], isLoading: loadingCosts } = useQuery<CostEntry[]>({
    queryKey: ["admin-cost-entries"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_cost_entries", { p_limit: 100, p_offset: 0 });
      if (error) throw error;
      return (data ?? []) as CostEntry[];
    },
  });

  const deleteCost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_cost_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cost-entries"] });
      qc.invalidateQueries({ queryKey: ["admin-pl-summary"] });
      toast.success("Lançamento removido");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const netTotal = (pl?.total_revenue_brl ?? 0) - (pl?.total_costs_brl ?? 0);
  const isProfit  = netTotal >= 0;

  const chartConfig = {
    revenue_brl: { label: "Receita",  color: "#10b981" },
    costs_brl:   { label: "Custos",   color: "#ef4444" },
    net_brl:     { label: "Lucro",    color: "#3b82f6" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-400" />
            Dashboard Financeiro
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Receita Stripe, custos operacionais e resultado (P&L) da plataforma
          </p>
        </div>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowAddCost(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Lançar custo
        </Button>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard
          label="MRR (estimado)"
          value={brl(revenue?.mrr_brl ?? 0)}
          sub="assinaturas ativas × preço do plano"
          icon={TrendingUp}
          accent="emerald"
          loading={loadingRev}
        />
        <KpiCard
          label="Receita últimos 30d"
          value={brl(revenue?.revenue_30d_brl ?? 0)}
          icon={DollarSign}
          accent="cyan"
          loading={loadingRev}
        />
        <KpiCard
          label="Receita total acumulada"
          value={brl(revenue?.total_revenue_brl ?? 0)}
          icon={CreditCard}
          accent="blue"
          loading={loadingRev}
        />
        <KpiCard
          label="Assinaturas ativas"
          value={String(revenue?.active_subscriptions ?? 0)}
          sub={`${revenue?.trialing_subscriptions ?? 0} em trial`}
          icon={Users}
          accent="purple"
          loading={loadingRev}
        />
        <KpiCard
          label="Custos (12 meses)"
          value={brl(pl?.total_costs_brl ?? 0)}
          icon={TrendingDown}
          accent="red"
          loading={loadingPL}
        />
        <KpiCard
          label={isProfit ? "Lucro líquido (12m)" : "Prejuízo (12m)"}
          value={brl(Math.abs(netTotal))}
          icon={isProfit ? TrendingUp : AlertCircle}
          accent={isProfit ? "emerald" : "red"}
          loading={loadingPL}
        />
      </div>

      {/* P&L Chart */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            Receita vs Custos — últimos 12 meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPL ? (
            <Skeleton className="h-56 w-full bg-slate-800" />
          ) : (
            <ChartContainer config={chartConfig} className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pl?.pl_by_month ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    width={48}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(v) => brl(Number(v))} />}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                  <Bar dataKey="revenue_brl" name="Receita"  fill="#10b981" radius={[4,4,0,0]} maxBarSize={28} />
                  <Bar dataKey="costs_brl"   name="Custos"   fill="#ef4444" radius={[4,4,0,0]} maxBarSize={28} />
                  <Bar dataKey="net_brl"     name="Lucro"    fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* P&L Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            Resultado por Mês (P&L)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingPL ? (
            <div className="p-4 space-y-2">
              {[1,2,3].map((i) => <Skeleton key={i} className="h-10 w-full bg-slate-800" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Mês</th>
                    <th className="text-right text-slate-400 font-medium px-4 py-3">Receita</th>
                    <th className="text-right text-slate-400 font-medium px-4 py-3">Custos</th>
                    <th className="text-right text-slate-400 font-medium px-4 py-3">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(pl?.pl_by_month ?? [])].reverse().map((row) => {
                    const net = row.net_brl;
                    return (
                      <tr key={row.month} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-slate-300 font-medium">{row.label}</td>
                        <td className="px-4 py-3 text-right text-emerald-400">{brl(row.revenue_brl)}</td>
                        <td className="px-4 py-3 text-right text-red-400">{brl(row.costs_brl)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${net >= 0 ? "text-blue-400" : "text-orange-400"}`}>
                          {net >= 0 ? "+" : ""}{brl(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-700">
                    <td className="px-4 py-3 text-slate-300 font-bold">Total (12m)</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">{brl(pl?.total_revenue_brl ?? 0)}</td>
                    <td className="px-4 py-3 text-right text-red-400 font-bold">{brl(pl?.total_costs_brl ?? 0)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${isProfit ? "text-blue-400" : "text-orange-400"}`}>
                      {isProfit ? "+" : ""}{brl(netTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Entries */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            Lançamentos de Custo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCosts ? (
            <div className="space-y-2">
              {[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full bg-slate-800" />)}
            </div>
          ) : costs.length === 0 ? (
            <div className="py-10 text-center">
              <TrendingDown className="h-7 w-7 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Nenhum custo lançado ainda.</p>
              <Button size="sm" variant="outline" className="border-slate-700 text-slate-400 hover:bg-slate-800 mt-3" onClick={() => setShowAddCost(true)}>
                Lançar primeiro custo
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {costs.map((c) => {
                const catLabel = CATEGORIES.find((x) => x.value === c.category)?.label ?? c.category;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors">
                    <Badge className={`text-xs shrink-0 ${CATEGORY_COLORS[c.category] ?? CATEGORY_COLORS.other}`}>
                      {catLabel}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-sm truncate">{c.description}</p>
                      <p className="text-slate-600 text-xs">{c.period_month}</p>
                    </div>
                    <p className="text-red-400 text-sm font-semibold shrink-0">{brl(Number(c.amount_brl))}</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                      onClick={() => deleteCost.mutate(c.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddCostDialog open={showAddCost} onClose={() => setShowAddCost(false)} />
    </div>
  );
}
