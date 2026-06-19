// ============================================================
// src/components/PendingTeamBanner.tsx
// Banner para times criados cujo checkout no Stripe não foi concluído.
// O time fica com subscription_status='pending_payment' e nunca é
// selecionado como activeTeam — ver useTeams.tsx — então o usuário só
// vê a visão de jogador até reativar e completar o pagamento aqui.
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Loader2 } from "lucide-react";

interface PendingTeam {
  id: string;
  name: string;
}

interface PendingTeamBannerProps {
  teams: PendingTeam[];
}

export function PendingTeamBanner({ teams }: PendingTeamBannerProps) {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (teams.length === 0) return null;

  const handleActivate = async (teamId: string) => {
    setLoadingId(teamId);
    try {
      const res = await supabase.functions.invoke("create-checkout-session", {
        body: { team_id: teamId, plan: "monthly", return_url: window.location.origin },
      });
      if (res.error || !res.data?.url) throw res.error ?? new Error("Sem URL de checkout");
      window.location.href = res.data.url;
    } catch {
      toast({ title: "Erro ao iniciar pagamento", description: "Tente novamente.", variant: "destructive" });
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {teams.map(team => (
        <div
          key={team.id}
          className="flex items-center justify-between gap-3 p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/10"
        >
          <div>
            <p className="font-semibold text-sm">Time "{team.name}" criado</p>
            <p className="text-xs text-muted-foreground">
              Finalize a assinatura para ativar o acesso de administrador.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => handleActivate(team.id)}
            disabled={loadingId === team.id}
          >
            {loadingId === team.id
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <CreditCard className="h-3.5 w-3.5" />}
            Ativar
          </Button>
        </div>
      ))}
    </div>
  );
}
