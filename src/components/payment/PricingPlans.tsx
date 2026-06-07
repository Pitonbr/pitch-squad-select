// ============================================================
// src/components/payment/PricingPlans.tsx
// Seleção de plano após criação do time
// Mensal R$59,90 | Anual R$646,92 (10% desconto)
// 7 dias de teste gratuito com cartão
// ============================================================

import { useState } from "react";
import { Button }   from "@/components/ui/button";
import { Badge }    from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2, Check, CreditCard, Trophy, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingPlansProps {
  teamName: string;
  onSkip?: () => void; // só em dev
}

const PLANS = [
  {
    id:       "monthly" as const,
    label:    "Mensal",
    price:    "R$ 59,90",
    sub:      "por mês",
    saving:   null,
    popular:  false,
    badge:    null,
  },
  {
    id:       "annual" as const,
    label:    "Anual",
    price:    "R$ 646,92",
    sub:      "por ano",
    monthly:  "R$ 53,91/mês",
    saving:   "Economize R$ 71,88",
    popular:  true,
    badge:    "10% OFF",
  },
] as const;

const FEATURES = [
  "Cadastro ilimitado de jogadores",
  "Agendamento de jogos e convocações",
  "Rankings e estatísticas de presença",
  "Gestão financeira do time",
  "Busca de adversários (Matchmaking)",
  "Notificações push em tempo real",
  "Campeonatos e chaveamentos",
  "Suporte por e-mail",
];

export function PricingPlans({ teamName, onSkip }: PricingPlansProps) {
  const { startCheckout } = useSubscription();
  const [selected, setSelected]   = useState<"monthly" | "annual">("annual");
  const [loading, setLoading]     = useState(false);

  const handleStart = async () => {
    setLoading(true);
    await startCheckout(selected);
    // If redirect happens, this line won't run
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto text-3xl">
          🏆
        </div>
        <h2 className="text-2xl font-bold">Seu time está pronto!</h2>
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{teamName}</strong> foi criado.
          Escolha um plano para ativar o acesso completo.
        </p>
      </div>

      {/* Trial banner */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/25">
        <Zap className="h-4 w-4 text-green-500 shrink-0" />
        <p className="text-sm text-green-600 font-medium">
          7 dias gratuitos — cancele antes e não será cobrado nada.
        </p>
      </div>

      {/* Plan selector */}
      <div className="grid grid-cols-2 gap-3">
        {PLANS.map(plan => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelected(plan.id)}
            className={cn(
              "relative p-4 rounded-2xl border-2 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2",
              selected === plan.id
                ? "border-primary bg-primary/8"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            {plan.badge && (
              <span className="absolute -top-2.5 right-3 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {plan.badge}
              </span>
            )}
            {plan.popular && selected !== plan.id && (
              <span className="absolute -top-2.5 right-3 bg-muted-foreground/40 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Popular
              </span>
            )}
            <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1", selected === plan.id ? "text-primary" : "text-muted-foreground")}>
              {plan.label}
            </p>
            <p className={cn("text-xl font-bold", selected === plan.id ? "text-primary" : "text-foreground")}>
              {plan.price}
            </p>
            <p className="text-[11px] text-muted-foreground">{plan.sub}</p>
            {plan.saving && (
              <p className="text-[11px] text-green-600 font-medium mt-1">{plan.saving}</p>
            )}
          </button>
        ))}
      </div>

      {/* Features */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Tudo incluído nos dois planos
        </p>
        {FEATURES.map(f => (
          <div key={f} className="flex items-center gap-2.5 text-sm">
            <Check className="h-4 w-4 text-primary shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>
          Após 7 dias de teste, será cobrado automaticamente no cartão cadastrado.
          Cancele a qualquer momento pelo painel de configurações.
          Taxa adicional: R$10 por time ao confirmar um jogo contra outro time
          (cobrado de cada time separadamente — jogo criado apenas após os dois pagarem).
          Valores não reembolsáveis.
        </p>
      </div>

      {/* CTA */}
      <Button
        className="w-full h-12 text-base font-semibold gap-2"
        onClick={handleStart}
        disabled={loading}
      >
        {loading
          ? <><Loader2 className="h-5 w-5 animate-spin" /> Redirecionando...</>
          : <><CreditCard className="h-5 w-5" /> Começar 7 dias grátis</>}
      </Button>

      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="w-full text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Pular por agora (modo dev)
        </button>
      )}
    </div>
  );
}
