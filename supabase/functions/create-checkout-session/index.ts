// ============================================================
// create-checkout-session — Stripe Checkout para assinatura
// Planos: monthly R$59,90 | annual R$646,92 (10% desconto)
// Trial: 30 dias grátis com cartão cadastrado
// ============================================================

import { serve }       from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe          from "npm:stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stripe Price IDs — configurados no painel Stripe
const PRICES = {
  monthly: Deno.env.get("STRIPE_PRICE_MONTHLY") ?? "", // R$59,90/mês
  annual:  Deno.env.get("STRIPE_PRICE_ANNUAL")  ?? "", // R$646,92/ano
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    // Auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const authHeader = req.headers.get("Authorization")!;
    const token      = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return new Response("Unauthorized", { status: 401 });

    const { team_id, plan, return_url } = await req.json() as {
      team_id: string;
      plan: "monthly" | "annual";
      return_url: string;
    };

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, phone")
      .eq("user_id", user.id)
      .single();

    // Get team
    const { data: team } = await supabase
      .from("teams")
      .select("id, name, stripe_customer_id")
      .eq("id", team_id)
      .single();

    if (!team) return new Response("Team not found", { status: 404 });

    // Only the team admin can manage the subscription
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", team_id)
      .eq("profile_id", profile?.id)
      .maybeSingle();

    if (!membership || membership.role !== "admin") {
      return new Response("Forbidden: only the team admin can manage the subscription", { status: 403 });
    }

    // Create or reuse Stripe Customer
    let customerId = team.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name:  team.name,
        metadata: {
          team_id:    team.id,
          profile_id: profile?.id ?? "",
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      await supabase.from("teams").update({ stripe_customer_id: customerId }).eq("id", team.id);
    }

    const priceId = PRICES[plan];
    if (!priceId) return new Response("Invalid plan", { status: 400 });

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer:    customerId,
      mode:        "subscription",
      line_items:  [{ price: priceId, quantity: 1 }],
      // 30-day free trial
      subscription_data: {
        trial_period_days: 30,
        metadata: { team_id: team.id, plan },
      },
      payment_method_types: ["card", "boleto"],
      // PIX not yet available in BR Stripe for subscriptions; use card + boleto
      success_url: `${return_url}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
      // Time já existe como pending_payment — se o usuário desistir, volta pra
      // raiz, que naturalmente trata isso como "sem time ativo" (PendingTeamBanner).
      cancel_url:  `${return_url}/`,
      locale: "pt-BR",
      custom_text: {
        submit: {
          message: "Após o período de teste de 30 dias, será cobrado automaticamente. Cancele a qualquer momento.",
        },
      },
      metadata: { team_id: team.id, plan, profile_id: profile?.id ?? "" },
      allow_promotion_codes: true,
    });

    // Save pending transaction
    await supabase.from("payment_transactions").insert({
      profile_id: profile?.id,
      team_id:    team.id,
      type:       "subscription",
      amount_cents: plan === "monthly" ? 5990 : 64692,
      currency:   "brl",
      stripe_session_id: session.id,
      status:     "pending",
      metadata:   { plan, session_id: session.id },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("create-checkout-session error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
