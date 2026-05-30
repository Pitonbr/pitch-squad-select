// ============================================================
// get-portal-session — Abre o Customer Portal do Stripe
// Permite ao admin: atualizar cartão, trocar plano, cancelar
// ============================================================

import { serve }        from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe           from "npm:stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2024-06-20" });

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user) return new Response("Unauthorized", { status: 401 });

    const { team_id, return_url } = await req.json() as { team_id: string; return_url: string };

    const { data: team } = await supabase
      .from("teams")
      .select("stripe_customer_id")
      .eq("id", team_id)
      .single();

    if (!team?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: "No Stripe customer found for this team" }), {
        status: 404, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   team.stripe_customer_id,
      return_url: `${return_url}/settings?tab=subscription`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("get-portal-session error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
