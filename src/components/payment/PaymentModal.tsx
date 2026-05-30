// ============================================================
// src/components/payment/PaymentModal.tsx
// Modal de cobrança única — R$10 (entrada) | R$20 (desafio aceito)
// ============================================================

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge }  from "@/components/ui/badge";
import { Loader2, CreditCard, Shield, AlertCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type PaymentType = "join_fee" | "matchup_fee";

interface PaymentConfig {
  title:       string;
  amount:      string;
  description: string;
  disclaimer:  string;
  icon:        string;
}

const CONFIGS: Record<PaymentType, PaymentConfig> = {
  join_fee: {
    title:       "Taxa de Entrada no Time",
    amount:      "R$ 10,00",
    description: "Pagamento único para confirmar sua entrada no time após aprovação.",
    disclaimer:  "Este valor não é reembolsável, mesmo em caso de cancelamento de jogos ou saída do time.",
    icon:        "⚽",
  },
  matchup_fee: {
    title:       "Taxa de Desafio Aceito",
    amount:      "R$ 20,00",
    description: "O time adversário aceitou o desafio! Pague para confirmar a partida.",
    disclaimer:  "Este valor não é reembolsável, mesmo em caso de cancelamento ou remarcação da partida.",
    icon:        "⚔️",
  },
};

interface PaymentModalProps {
  open:      boolean;
  onClose:   () => void;
  type:      PaymentType;
  teamId:    string;
  // join_fee extras
  joinRequestId?:    string;
  // matchup_fee extras
  challengedTeamId?: string;
  challengeId?:      string;
  teamName?:         string;
}

export function PaymentModal({
  open, onClose, type, teamId,
  joinRequestId, challengedTeamId, challengeId, teamName,
}: PaymentModalProps) {
  const { toast } = useToast();
  const cfg = CONFIGS[type];
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handlePay = async () => {
    if (!accepted) {
      toast({ title: "Aceite os termos antes de continuar", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: {
          type,
          team_id:           teamId,
          return_url:        window.location.origin,
          join_request_id:   joinRequestId,
          challenged_team_id: challengedTeamId,
          challenge_id:      challengeId,
        },
      });

      if (error || !data?.url) throw new Error(error?.message ?? "Erro ao criar sessão de pagamento");

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (e: any) {
      toast({ title: "Erro ao processar pagamento", description: e.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{cfg.icon}</span>
            {cfg.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Amount highlight */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
            <span className="text-sm font-medium text-muted-foreground">Valor a pagar</span>
            <span className="text-2xl font-bold text-primary">{cfg.amount}</span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">{cfg.description}</p>

          {teamName && (
            <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg">
              <span className="text-sm font-medium">Time:</span>
              <span className="text-sm text-primary font-semibold">{teamName}</span>
            </div>
          )}

          {/* Disclaimer — must accept */}
          <div
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
              accepted
                ? "bg-primary/5 border-primary/30"
                : "bg-destructive/5 border-destructive/20 hover:border-destructive/40"
            )}
            onClick={() => setAccepted(v => !v)}
          >
            <div className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
              accepted ? "bg-primary border-primary" : "border-muted-foreground"
            )}>
              {accepted && <span className="text-white text-[10px] font-bold">✓</span>}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-0.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-destructive" />
                Política de não reembolso
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{cfg.disclaimer}</p>
            </div>
          </div>

          {/* Payment methods */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-green-500" />
            <span>Pagamento seguro via Stripe — PIX, cartão de crédito ou débito</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button className="flex-1 gap-2" onClick={handlePay} disabled={loading || !accepted}>
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Aguarde...</>
                : <><CreditCard className="h-4 w-4" /> Pagar {cfg.amount}</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
