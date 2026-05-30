// ============================================================
// src/hooks/useSubscription.ts
// Estado da assinatura do time ativo — lido do banco em tempo real
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTeams } from "@/hooks/useTeams";
import { useAuth }  from "@/hooks/useAuth";

export type SubscriptionStatus =
  | "inactive"   // nunca assinou
  | "trialing"   // trial ativo
  | "active"     // pago em dia
  | "readonly"   // pagamento em atraso — can view, can't create
  | "canceled";  // cancelou

export interface SubscriptionInfo {
  status:           SubscriptionStatus;
  plan:             "monthly" | "annual" | null;
  trialEnd:         Date | null;
  periodEnd:        Date | null;
  cancelAtPeriodEnd: boolean;
  canAccess:        boolean; // trialing | active | readonly
  canCreate:        boolean; // trialing | active only
  daysUntilEnd:     number | null;
}

const DEFAULT: SubscriptionInfo = {
  status: "inactive", plan: null, trialEnd: null,
  periodEnd: null, cancelAtPeriodEnd: false,
  canAccess: false, canCreate: false, daysUntilEnd: null,
};

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

export function useSubscription() {
  const { activeTeam }   = useTeams();
  const { user }         = useAuth();
  const [info, setInfo]  = useState<SubscriptionInfo>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!activeTeam) { setInfo(DEFAULT); setLoading(false); return; }

    const { data: team } = await supabase
      .from("teams")
      .select("subscription_status, subscription_plan, subscription_trial_end, subscription_period_end")
      .eq("id", activeTeam.id)
      .single();

    if (!team) { setInfo(DEFAULT); setLoading(false); return; }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("cancel_at_period_end")
      .eq("team_id", activeTeam.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const status    = (team.subscription_status ?? "inactive") as SubscriptionStatus;
    const trialEnd  = team.subscription_trial_end  ? new Date(team.subscription_trial_end)  : null;
    const periodEnd = team.subscription_period_end ? new Date(team.subscription_period_end) : null;

    setInfo({
      status,
      plan:             (team.subscription_plan as "monthly" | "annual") ?? null,
      trialEnd,
      periodEnd,
      cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
      canAccess:        ["trialing","active","readonly"].includes(status),
      canCreate:        ["trialing","active"].includes(status),
      daysUntilEnd:     daysUntil(trialEnd ?? periodEnd),
    });
    setLoading(false);
  }, [activeTeam?.id]);

  useEffect(() => {
    fetchStatus();

    if (!activeTeam) return;

    // Real-time updates when subscription_status changes
    const channel = supabase.channel(`sub-${activeTeam.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "teams",
        filter: `id=eq.${activeTeam.id}`,
      }, () => fetchStatus())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTeam?.id, fetchStatus]);

  const openPortal = useCallback(async () => {
    if (!activeTeam || !user) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("get-portal-session", {
      body: { team_id: activeTeam.id, return_url: window.location.origin },
    });
    if (res.data?.url) window.location.href = res.data.url;
  }, [activeTeam, user]);

  const startCheckout = useCallback(async (plan: "monthly" | "annual") => {
    if (!activeTeam) return;
    const res = await supabase.functions.invoke("create-checkout-session", {
      body: { team_id: activeTeam.id, plan, return_url: window.location.origin },
    });
    if (res.data?.url) window.location.href = res.data.url;
  }, [activeTeam]);

  return { info, loading, openPortal, startCheckout, refresh: fetchStatus };
}
