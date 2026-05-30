// ============================================================
// src/components/payment/SubscriptionManager.tsx
// Aba "Assinatura" em Settings — gerencia plano do time
// ============================================================

import { useState }          from "react";
import { Button }            from "@/components/ui/button";
import { Badge }             from "@/components/ui/badge";
import { Separator }         from "@/components/ui/separator";
import { useSubscription }   from "@/hooks/useSubscription";
import { useTeams }          from "@/hooks/useTeams";
import { Loader2, CreditCard, ExternalLink, Zap, CheckCircle,
         AlertTriangle, Clock, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  trialing:  { label: "Período de teste",   color: "text-green-600",  bg: "bg-green-500/10 border-green-500/25", icon: Zap },
  active:    { label: "Ativo",              color: "text-green-600",  bg: "bg-green-500/10 border-green-500/25", icon: CheckCircle },
  readonly:  { label: "Pagamento em atraso",color: "text-amber-600",  bg: "bg-amber-500/10 border-amber-500/25", icon: AlertTriangle },
  inactive:  { label: "Inativo",           color: "text-muted-foreground", bg: "bg-muted/40 border-border", icon: XCircle },
  canceled:  { label: "Cancelado",         color: "text-destructive", bg: "bg-destructive/10 border-destructive/25", icon: XCircle },
};

export function SubscriptionManager() {
  const { info, loading, openPortal, startCheckout, refresh } = useSubscription();
  const { activeTeam } = useTeams();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<"monthly"|"annual"|null>(null);

  const handlePortal = async () => {
    setPortalLoading(true);
    await openPortal();
    setPortalLoading(false);
  };

  const handleCheckout = async (plan: "monthly" | "annual") => {
    setCheckoutLoading(plan);
    await startCheckout(plan);
    setCheckoutLoading(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!activeTeam) return (
    <div className="text-center py-12 text-muted-foreground text-sm">
      Selecione um time para gerenciar a assinatura.
    </div>
  );

  const cfg = STATUS_CONFIG[info.status] ?? STATUS_CONFIG.inactive;
  const StatusIcon = cfg.icon;

  return (
    <div className="space-y-6">

      {/* Current status card */}
      <div className={cn("flex items-start gap-4 p-4 rounded-xl border", cfg.bg)}>
        <StatusIcon className={cn("h-5 w-5 shrink-0 mt-0.5", cfg.color)} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn("font-semibold", cfg.color)}>{cfg.label}</p>
            {info.plan && (
              <Badge variant="outline" className="text-[10px]">
                Plano {info.plan === "monthly" ? "Mensal" : "Anual"}
              </Badge>
            )}
          </div>

          {info.status === "trialing" && info.trialEnd && (
            <p className="text-sm text-muted-foreground mt-1">
              Teste gratuito termina em{" "}
              <strong>{info.trialEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</strong>
              {info.daysUntilEnd !== null && ` (${info.daysUntilEnd} dia${info.daysUntilEnd !== 1 ? "s" : ""})`}.
              Após esse período, será cobrado automaticamente.
            </p>
          )}
          {info.status === "active" && info.periodEnd && (
            <p className="text-sm text-muted-foreground mt-1">
              Próxima cobrança em{" "}
              <strong>{info.periodEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</strong>.
              {info.cancelAtPeriodEnd && " (cancelamento agendado ao fim do período)"}
            </p>
          )}
          {info.status === "readonly" && (
            <p className="text-sm mt-1">
              Seu time está em modo somente leitura. Regularize para criar jogos e convocações.
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8"
          onClick={refresh}
          title="Atualizar status"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Active subscription actions */}
      {(info.status === "active" || info.status === "trialing" || info.status === "readonly") && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gerenciar assinatura</p>

          <Button
            variant="outline"
            className="w-full gap-2 justify-start"
            onClick={handlePortal}
            disabled={portalLoading}
          >
            {portalLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <ExternalLink className="h-4 w-4" />}
            Acessar portal de cobrança Stripe
          </Button>
          <p className="text-xs text-muted-foreground">
            No portal você pode: trocar cartão, mudar de plano mensal ↔ anual, cancelar assinatura ou baixar faturas.
          </p>
        </div>
      )}

      {/* No subscription / inactive — show plans */}
      {(info.status === "inactive" || info.status === "canceled") && (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Escolher plano</p>

          <div className="grid grid-cols-2 gap-3">
            {/* Monthly */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div>
                <p className="text-sm font-semibold">Mensal</p>
                <p className="text-2xl font-bold text-primary">R$59,90</p>
                <p className="text-xs text-muted-foreground">por mês</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5"
                onClick={() => handleCheckout("monthly")}
                disabled={!!checkoutLoading}
              >
                {checkoutLoading === "monthly"
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <CreditCard className="h-3.5 w-3.5" />}
                Assinar
              </Button>
            </div>

            {/* Annual */}
            <div className="relative p-4 rounded-xl border-2 border-primary bg-primary/5 space-y-3">
              <span className="absolute -top-2.5 right-3 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                10% OFF
              </span>
              <div>
                <p className="text-sm font-semibold text-primary">Anual</p>
                <p className="text-2xl font-bold text-primary">R$646,92</p>
                <p className="text-xs text-muted-foreground">por ano · R$53,91/mês</p>
                <p className="text-xs text-green-600 font-medium mt-0.5">Economize R$71,88</p>
              </div>
              <Button
                size="sm"
                className="w-full gap-1.5"
                onClick={() => handleCheckout("annual")}
                disabled={!!checkoutLoading}
              >
                {checkoutLoading === "annual"
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Zap className="h-3.5 w-3.5" />}
                Assinar
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            7 dias de teste gratuito — cancele antes sem cobrança
          </p>
        </div>
      )}

      <Separator />

      {/* Fee table */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Taxas adicionais</p>
        <div className="space-y-2">
          {[
            { label: "Entrada de jogador em time",    value: "R$ 10,00", who: "Pago pelo jogador", note: "Após aprovação do admin" },
            { label: "Desafio aceito entre times",    value: "R$ 20,00", who: "Pago pelo time desafiante", note: "Quando o adversário aceitar" },
          ].map(row => (
            <div key={row.label} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-card border border-border">
              <div>
                <p className="text-sm font-medium">{row.label}</p>
                <p className="text-[11px] text-muted-foreground">{row.who} · {row.note}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-primary">{row.value}</p>
                <p className="text-[10px] text-muted-foreground">Não reembolsável</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
