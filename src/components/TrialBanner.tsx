// ============================================================
// src/components/TrialBanner.tsx
// Banner de topo mostrando dias restantes do trial gratuito
// ============================================================

import { Zap, CreditCard, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TrialBannerProps {
  daysRemaining: number;
  onSubscribe: () => void;
}

export function TrialBanner({ daysRemaining, onSubscribe }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const isLastDay = daysRemaining <= 1;

  return (
    <div className={[
      "w-full px-4 py-2 flex items-center gap-3 text-sm",
      isLastDay
        ? "bg-amber-500/15 border-b border-amber-500/30 text-amber-700"
        : "bg-green-500/12 border-b border-green-500/25 text-green-700",
    ].join(" ")}>
      <Zap className="h-4 w-4 shrink-0" />
      <p className="flex-1 font-medium">
        {isLastDay
          ? "Último dia de teste gratuito! Assine para continuar usando o Soccer Squad."
          : `Você está no período de teste gratuito — ${daysRemaining} dias restantes.`}
      </p>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs shrink-0 border-current"
        onClick={onSubscribe}
      >
        <CreditCard className="h-3 w-3 mr-1" />
        Assinar agora
      </Button>
      <button
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        onClick={() => setDismissed(true)}
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
