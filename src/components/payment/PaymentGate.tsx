// ============================================================
// src/components/payment/PaymentGate.tsx
// Bloqueia ações de criação quando assinatura está em readonly/inactive.
// Freemium: readonly = pode ver, não pode criar.
// ============================================================

import { useSubscription } from "@/hooks/useSubscription";
import { Button }          from "@/components/ui/button";
import { Badge }           from "@/components/ui/badge";
import { AlertTriangle, Lock, CreditCard, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentGateProps {
  /** Se true, exibe o conteúdo mesmo com acesso bloqueado (para "ver") */
  allowReadonly?: boolean;
  /** Fallback exibido quando o acesso de criação está bloqueado */
  children: React.ReactNode;
  /** Mensagem contextual do que está sendo bloqueado */
  actionLabel?: string;
}

export function PaymentGate({ children, allowReadonly = false, actionLabel = "esta ação" }: PaymentGateProps) {
  const { info, loading, startCheckout } = useSubscription();

  if (loading) return <>{children}</>;

  // Full access
  if (info.canCreate) return <>{children}</>;

  // Readonly mode: can see, can't create
  if (info.status === "readonly" && allowReadonly) {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-50 select-none">{children}</div>
        <ReadonlyBanner onAction={() => startCheckout("monthly")} />
      </div>
    );
  }

  // Fully blocked
  if (!info.canAccess) {
    return <InactiveBanner teamHasNoSub={info.status === "inactive"} onAction={() => startCheckout("annual")} />;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-50 select-none">{children}</div>
      <ReadonlyBanner actionLabel={actionLabel} onAction={() => startCheckout("monthly")} />
    </div>
  );
}

// ── Banner para readonly (pagamento atrasado) ────────────────
function ReadonlyBanner({ actionLabel = "criar novos jogos", onAction }: { actionLabel?: string; onAction: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl z-10 p-6 text-center gap-4">
      <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-amber-500" />
      </div>
      <div>
        <p className="font-semibold">Pagamento em atraso</p>
        <p className="text-sm text-muted-foreground mt-1">
          Você pode visualizar os dados mas não pode {actionLabel} até regularizar.
        </p>
      </div>
      <Button className="gap-2" onClick={onAction}>
        <CreditCard className="h-4 w-4" /> Regularizar assinatura
      </Button>
    </div>
  );
}

// ── Banner para conta inativa/sem assinatura ─────────────────
function InactiveBanner({ teamHasNoSub, onAction }: { teamHasNoSub: boolean; onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-5">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
        <Lock className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <p className="font-semibold text-lg">
          {teamHasNoSub ? "Ative sua assinatura" : "Assinatura inativa"}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {teamHasNoSub
            ? "Para acessar todos os recursos do Soccer Squad, escolha um plano a partir de R$59,90/mês."
            : "Sua assinatura foi cancelada. Reative para continuar usando o app."}
        </p>
      </div>
      <Button className="gap-2 h-11 font-semibold" onClick={onAction}>
        <Zap className="h-4 w-4" />
        {teamHasNoSub ? "Ver planos — 7 dias grátis" : "Reativar assinatura"}
      </Button>
    </div>
  );
}

// ── Chip de status da assinatura (para header/sidebar) ───────
export function SubscriptionStatusChip() {
  const { info, loading } = useSubscription();
  if (loading || info.canCreate) return null;

  if (info.status === "trialing") {
    return (
      <Badge className="bg-green-500/15 text-green-600 border-green-500/25 text-[10px] gap-1">
        <Zap className="h-2.5 w-2.5" />
        Trial — {info.daysUntilEnd ?? 0}d restantes
      </Badge>
    );
  }
  if (info.status === "readonly") {
    return (
      <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/25 text-[10px] gap-1">
        <AlertTriangle className="h-2.5 w-2.5" />
        Pagamento atrasado
      </Badge>
    );
  }
  if (info.status === "inactive" || info.status === "canceled") {
    return (
      <Badge className="bg-destructive/15 text-destructive border-destructive/25 text-[10px] gap-1">
        <Lock className="h-2.5 w-2.5" />
        Inativo
      </Badge>
    );
  }
  return null;
}
