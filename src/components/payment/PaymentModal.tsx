// ============================================================
// src/components/payment/PaymentModal.tsx
// Modal de cobrança por jogo entre times — R$10 por time
// Cada time paga separadamente. Jogo confirmado quando os dois pagam.
// ============================================================

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Shield, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type PaymentType = "matchup_fee";
type PayerRole   = "challenger" | "challenged";

interface PaymentModalProps {
  open:       boolean;
  onClose:    () => void;
  type:       PaymentType;
  teamId:     string;
  teamName?:  string;
  challengeId:    string;
  payerRole:      PayerRole;
  adversaryName?: string;
}

export function PaymentModal({
  open, onClose, teamId, teamName, challengeId, payerRole, adversaryName,
}: PaymentModalProps) {
  const { toast } = useToast();
  const [loading,  setLoading]  = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handlePay = async () => {
    if (!accepted) {
      toast({ title: "Aceite os termos antes de continuar", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment-intent", {
        body: {
          type:         "matchup_fee",
          team_id:      teamId,
          return_url:   window.location.origin,
          challenge_id: challengeId,
          payer_role:   payerRole,
        },
      });
      if (error || !data?.url) throw new Error(error?.message ?? "Erro ao criar sessão de pagamento");
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
            <span className="text-2xl">⚔️</span>
            Confirmação de Jogo entre Times
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Amount */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
            <span className="text-sm font-medium text-muted-foreground">Valor por time</span>
            <span className="text-2xl font-bold text-primary">R$ 10,00</span>
          </div>

          {/* Info */}
          <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
            <p>
              Cada time paga <strong>R$10</strong> separadamente.
              O jogo é criado e confirmado somente após os dois times realizarem o pagamento.
            </p>
            {adversaryName && (
              <p className="text-foreground font-medium">Adversário: {adversaryName}</p>
            )}
          </div>

          {teamName && (
            <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg">
              <span className="text-sm font-medium">Seu time:</span>
              <span className="text-sm text-primary font-semibold">{teamName}</span>
            </div>
          )}

          {/* Disclaimer */}
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
              <p className="text-xs text-muted-foreground leading-relaxed">
                Este valor não é reembolsável, mesmo em caso de cancelamento ou remarcação da partida.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-green-500" />
            <span>Pagamento seguro via Stripe — PIX, cartão de crédito ou boleto</span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button className="flex-1 gap-2" onClick={handlePay} disabled={loading || !accepted}>
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Aguarde...</>
                : <><CreditCard className="h-4 w-4" /> Pagar R$ 10,00</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
