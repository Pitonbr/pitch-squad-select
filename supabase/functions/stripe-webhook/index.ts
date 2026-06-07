// ============================================================
// stripe-webhook — Processa todos os eventos Stripe
// CRÍTICO: toda lógica de liberação de acesso acontece aqui.
// Nunca confiar no frontend para liberar acesso.
// ============================================================

import { serve }        from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe           from "npm:stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe  = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2024-06-20" });
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "stripe-signature, content-type" };

// ── Helpers ──────────────────────────────────────────────────

async function setTeamSubscriptionStatus(teamId: string, status: string, extra?: Record<string, unknown>) {
  await supabase.from("teams").update({
    subscription_status: status,
    ...extra,
  }).eq("id", teamId);
}

async function upsertSubscription(teamId: string, sub: Stripe.Subscription) {
  const plan = (sub.metadata?.plan ?? "monthly") as string;
  await supabase.from("subscriptions").upsert({
    team_id:                 teamId,
    stripe_customer_id:      String(sub.customer),
    stripe_subscription_id:  sub.id,
    stripe_price_id:         sub.items.data[0]?.price.id ?? null,
    plan,
    status:                  sub.status,
    trial_end:               sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    current_period_end:      new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end:    sub.cancel_at_period_end,
    updated_at:              new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" });
}

async function updateTransaction(sessionId: string, status: string, intentId?: string) {
  await supabase.from("payment_transactions").update({
    status,
    ...(intentId ? { stripe_payment_intent_id: intentId } : {}),
  }).eq("stripe_session_id", sessionId);
}

async function markPendingPaid(sessionId: string) {
  await supabase.from("pending_payments").update({ status: "paid" }).eq("stripe_session_id", sessionId);
}

// ── Main handler ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const body      = await req.text();
  const signature = req.headers.get("stripe-signature");
  const secret    = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !secret) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`Stripe event: ${event.type}`);

  try {
    switch (event.type) {

      // ── SUBSCRIPTIONS ─────────────────────────────────────

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const teamId = session.metadata?.team_id;
        if (!teamId) break;

        await updateTransaction(session.id, "succeeded", session.payment_intent as string);

        // Update team with subscription id and status
        await supabase.from("teams").update({
          subscription_id:     session.subscription as string,
          subscription_status: "trialing",
          subscription_plan:   session.metadata?.plan ?? "monthly",
        }).eq("id", teamId);

        console.log(`Team ${teamId} subscription started (trialing)`);
        break;
      }

      case "customer.subscription.trial_will_end": {
        // 3 days before trial ends — send reminder (via email edge function)
        const sub    = event.data.object as Stripe.Subscription;
        const teamId = sub.metadata?.team_id;
        if (!teamId) break;

        await supabase.functions.invoke("send-payment-reminder", {
          body: { team_id: teamId, type: "trial_ending" },
        }).catch(() => {});
        break;
      }

      case "customer.subscription.updated": {
        const sub    = event.data.object as Stripe.Subscription;
        const teamId = sub.metadata?.team_id;
        if (!teamId) break;

        await upsertSubscription(teamId, sub);

        // Map Stripe status to our status
        const statusMap: Record<string, string> = {
          active:    "active",
          trialing:  "trialing",
          past_due:  "readonly",   // can view, can't create — Opção C
          unpaid:    "readonly",
          canceled:  "inactive",
          incomplete: "inactive",
          incomplete_expired: "inactive",
          paused:    "readonly",
        };
        const ourStatus = statusMap[sub.status] ?? "inactive";
        await setTeamSubscriptionStatus(teamId, ourStatus, {
          subscription_plan:       sub.metadata?.plan ?? "monthly",
          subscription_trial_end:  sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          subscription_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        });

        console.log(`Team ${teamId} subscription updated: ${sub.status} → ${ourStatus}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub    = event.data.object as Stripe.Subscription;
        const teamId = sub.metadata?.team_id;
        if (!teamId) break;

        await upsertSubscription(teamId, sub);
        await setTeamSubscriptionStatus(teamId, "inactive");
        console.log(`Team ${teamId} subscription cancelled`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const teamId  = (invoice.subscription_details?.metadata?.team_id ?? invoice.metadata?.team_id) as string;
        if (!teamId) break;

        // Ensure status is active after successful payment
        await setTeamSubscriptionStatus(teamId, "active");
        console.log(`Team ${teamId} invoice paid — set active`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const teamId  = (invoice.subscription_details?.metadata?.team_id ?? invoice.metadata?.team_id) as string;
        if (!teamId) break;

        // Opção C: readonly on payment failure
        await setTeamSubscriptionStatus(teamId, "readonly");

        // Send failure notification
        await supabase.functions.invoke("send-payment-reminder", {
          body: { team_id: teamId, type: "payment_failed" },
        }).catch(() => {});
        console.log(`Team ${teamId} payment failed — set readonly`);
        break;
      }

      // ── ONE-TIME PAYMENTS ─────────────────────────────────

      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const type   = intent.metadata?.type as string;

        if (!type) break;

        // Update transactions and pending_payments
        // Find session by payment_intent
        const sessions = await stripe.checkout.sessions.list({ payment_intent: intent.id, limit: 1 });
        const sessionId = sessions.data[0]?.id;
        if (sessionId) {
          await updateTransaction(sessionId, "succeeded", intent.id);
          await markPendingPaid(sessionId);
        }

        if (type === "matchup_fee") {
          // Each team pays R$10 separately.
          // payer_role = "challenger" | "challenged"
          const challengeId = intent.metadata?.challenge_id;
          const payerRole   = intent.metadata?.payer_role as "challenger" | "challenged" | undefined;

          if (challengeId && payerRole) {
            const field = payerRole === "challenger" ? "challenger_paid_at" : "challenged_paid_at";
            await supabase.from("team_challenges")
              .update({ [field]: new Date().toISOString() })
              .eq("id", challengeId);

            // Check if BOTH teams have now paid
            const { data: challenge } = await supabase
              .from("team_challenges")
              .select("id, challenger_team_id, challenged_team_id, challenger_paid_at, challenged_paid_at")
              .eq("id", challengeId)
              .single();

            if (challenge?.challenger_paid_at && challenge?.challenged_paid_at) {
              // Both paid → confirm and create the game
              await supabase.from("team_challenges")
                .update({ status: "confirmed" })
                .eq("id", challengeId);

              // Create game record for each team (or a shared inter-team game)
              const { data: game } = await supabase.from("games").insert({
                team_id:     challenge.challenger_team_id,
                title:       "Jogo entre times",
                date:        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                time:        "16:00",
                location:    "A definir",
                status:      "scheduled",
                description: `Desafio aceito — aguarda definição de local e horário.`,
              }).select().single();

              // Link game to challenge
              if (game) {
                await supabase.from("team_challenges")
                  .update({ game_id: game.id })
                  .eq("id", challengeId);
              }

              // Notify both teams
              await supabase.functions.invoke("send-team-broadcast", {
                body: {
                  team_id: challenge.challenger_team_id,
                  title:   "Jogo confirmado! ⚽",
                  message: "Ambos os times confirmaram o pagamento. O jogo foi marcado!",
                },
              }).catch(() => {});
              await supabase.functions.invoke("send-team-broadcast", {
                body: {
                  team_id: challenge.challenged_team_id,
                  title:   "Jogo confirmado! ⚽",
                  message: "Ambos os times confirmaram o pagamento. O jogo foi marcado!",
                },
              }).catch(() => {});
            } else {
              // Only one side paid — update status to reflect partial payment
              const newStatus = payerRole === "challenger" ? "challenger_paid" : "challenged_paid";
              await supabase.from("team_challenges").update({ status: newStatus }).eq("id", challengeId);
            }
          }
          console.log(`matchup_fee paid — challenge ${challengeId}, payer: ${payerRole}`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const sessions = await stripe.checkout.sessions.list({ payment_intent: intent.id, limit: 1 });
        const sessionId = sessions.data[0]?.id;
        if (sessionId) await updateTransaction(sessionId, "failed", intent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
