// ============================================================
// create-payment-intent — Cobranças únicas
// Tipos: join_fee (R$10) | matchup_fee (R$20)
// Usa Stripe Checkout para suporte a PIX + cartão
// ============================================================

import { serve }        from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe           from "npm:stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Payment type configs
const PAYMENT_CONFIG = {
  join_fee: {
    amount_cents:  1000,
    description:   "Taxa de entrada no time — R$10,00",
    disclaimer:    "Pagamento único e não reembolsável, mesmo em caso de cancelamento do jogo.",
    expires_hours: 48,
  },
  matchup_fee: {
    amount_cents:  2000,
    description:   "Taxa de desafio entre times — R$20,00",
    disclaimer:    "Pagamento único e não reembolsável, mesmo em caso de cancelamento da partida.",
    expires_hours: 24,
  },
} as const;

type PaymentType = keyof typeof PAYMENT_CONFIG;

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

    const body = await req.json() as {
      type:           PaymentType;
      team_id:        string;
      return_url:     string;
      // join_fee extras
      join_request_id?: string;
      // matchup_fee extras
      challenged_team_id?: string;
      challenge_id?:  string;
    };

    const config = PAYMENT_CONFIG[body.type];
    if (!config) return new Response("Invalid payment type", { status: 400 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("user_id", user.id)
      .single();

    const { data: team } = await supabase
      .from("teams")
      .select("id, name, stripe_customer_id")
      .eq("id", body.team_id)
      .single();

    if (!team) return new Response("Team not found", { status: 404 });

    // Create or reuse Stripe Customer for the player
    let customerId = team.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name:  profile?.display_name ?? user.email ?? "",
        metadata: { team_id: team.id, profile_id: profile?.id ?? "", supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    // Build metadata for webhook
    const metadata: Record<string, string> = {
      type:       body.type,
      team_id:    body.team_id,
      profile_id: profile?.id ?? "",
    };
    if (body.join_request_id)    metadata.join_request_id    = body.join_request_id;
    if (body.challenged_team_id) metadata.challenged_team_id = body.challenged_team_id;
    if (body.challenge_id)       metadata.challenge_id        = body.challenge_id;

    // Stripe Checkout Session (one-time payment) — supports PIX + card
    const session = await stripe.checkout.sessions.create({
      customer:    customerId,
      mode:        "payment",
      line_items: [{
        quantity:    1,
        price_data: {
          currency:     "brl",
          unit_amount:  config.amount_cents,
          product_data: {
            name:        config.description,
            description: config.disclaimer,
          },
        },
      }],
      payment_method_types: ["card", "boleto", "pix"],
      payment_intent_data: { metadata },
      success_url: `${body.return_url}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=${body.type}`,
      cancel_url:  `${body.return_url}/?payment_cancelled=true`,
      locale:      "pt-BR",
      expires_at:  Math.floor(Date.now() / 1000) + config.expires_hours * 3600,
      custom_text: {
        submit: { message: config.disclaimer },
      },
      metadata,
    });

    // Save pending payment record
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + config.expires_hours);

    await supabase.from("pending_payments").insert({
      profile_id:        profile?.id,
      team_id:           body.team_id,
      type:              body.type,
      amount_cents:      config.amount_cents,
      stripe_session_id: session.id,
      expires_at:        expiresAt.toISOString(),
      status:            "pending",
      metadata,
    });

    // Log transaction
    await supabase.from("payment_transactions").insert({
      profile_id:        profile?.id,
      team_id:           body.team_id,
      type:              body.type,
      amount_cents:      config.amount_cents,
      currency:          "brl",
      stripe_session_id: session.id,
      status:            "pending",
      metadata,
    });

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("create-payment-intent error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
