import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "create" | "delete" | "toggle";

interface CreatePayload {
  action: "create";
  code: string;
  description?: string;
  type: "discount_percent" | "free_trial";
  value: number;        // percent (1-100) or days
  max_uses?: number;
  expires_at?: string;  // ISO string
}

interface DeletePayload {
  action: "delete";
  id: string;
}

interface TogglePayload {
  action: "toggle";
  id: string;
  is_active: boolean;
}

type Payload = CreatePayload | DeletePayload | TogglePayload;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // Auth: only master admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: isAdmin } = await userClient.rpc("is_master_admin");
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const payload = await req.json() as Payload;

    if (payload.action === "create") {
      return await handleCreate(payload);
    }
    if (payload.action === "delete") {
      return await handleDelete(payload);
    }
    if (payload.action === "toggle") {
      return await handleToggle(payload);
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (err) {
    console.error("admin-stripe-coupon error:", err);
    return json({ error: "Erro interno" }, 500);
  }
});

// ── Create ───────────────────────────────────────────────────
async function handleCreate(p: CreatePayload) {
  // Validate
  if (!p.code || p.code.trim().length < 3) return json({ error: "Código inválido (mín. 3 chars)" }, 400);
  if (p.type === "discount_percent" && (p.value < 1 || p.value > 100)) {
    return json({ error: "Percentual deve ser entre 1 e 100" }, 400);
  }
  if (p.type === "free_trial" && p.value < 1) {
    return json({ error: "Trial deve ter pelo menos 1 dia" }, 400);
  }

  const code = p.code.trim().toUpperCase();

  // Check duplicate code
  const { data: existing } = await supabase
    .from("promo_codes")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (existing) return json({ error: `Código "${code}" já existe` }, 409);

  let stripeCouponId: string | null = null;
  let stripePromoId: string | null = null;

  // Create Stripe objects only for discount_percent
  if (p.type === "discount_percent") {
    const coupon = await stripe.coupons.create({
      name:        p.description ?? code,
      percent_off: p.value,
      duration:    "once",
      ...(p.max_uses   ? { max_redemptions: p.max_uses } : {}),
      ...(p.expires_at ? { redeem_by: Math.floor(new Date(p.expires_at).getTime() / 1000) } : {}),
      metadata:    { code, source: "soccer_squad_admin" },
    });

    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      ...(p.max_uses ? { max_redemptions: p.max_uses } : {}),
      ...(p.expires_at ? { expires_at: Math.floor(new Date(p.expires_at).getTime() / 1000) } : {}),
    });

    stripeCouponId = coupon.id;
    stripePromoId  = promo.id;
  }

  // Insert into DB
  const { data: record, error: dbErr } = await supabase
    .from("promo_codes")
    .insert({
      code,
      description:       p.description ?? null,
      type:              p.type,
      value:             p.value,
      max_uses:          p.max_uses ?? null,
      expires_at:        p.expires_at ?? null,
      is_active:         true,
      stripe_coupon_id:  stripeCouponId,
      stripe_promo_id:   stripePromoId,
    })
    .select()
    .single();

  if (dbErr) {
    // Rollback Stripe coupon if DB insert failed
    if (stripeCouponId) {
      try { await stripe.coupons.del(stripeCouponId); } catch {}
    }
    return json({ error: dbErr.message }, 500);
  }

  return json({ success: true, record });
}

// ── Delete ───────────────────────────────────────────────────
async function handleDelete(p: DeletePayload) {
  const { data: record } = await supabase
    .from("promo_codes")
    .select("stripe_coupon_id, code")
    .eq("id", p.id)
    .single();

  if (!record) return json({ error: "Cupom não encontrado" }, 404);

  // Archive on Stripe (cannot hard-delete used coupons)
  if (record.stripe_coupon_id) {
    try {
      await stripe.coupons.del(record.stripe_coupon_id);
    } catch (err) {
      console.warn("Stripe coupon delete failed (may already be deleted):", err);
    }
  }

  const { error } = await supabase.from("promo_codes").delete().eq("id", p.id);
  if (error) return json({ error: error.message }, 500);

  return json({ success: true });
}

// ── Toggle ───────────────────────────────────────────────────
async function handleToggle(p: TogglePayload) {
  const { data: record } = await supabase
    .from("promo_codes")
    .select("stripe_promo_id, stripe_coupon_id, used_count")
    .eq("id", p.id)
    .single();

  if (!record) return json({ error: "Cupom não encontrado" }, 404);

  // Sync with Stripe promotion code active state
  if (record.stripe_promo_id) {
    try {
      await stripe.promotionCodes.update(record.stripe_promo_id, { active: p.is_active });
    } catch (err) {
      console.warn("Stripe promotion code toggle failed:", err);
    }
  }

  const { error } = await supabase
    .from("promo_codes")
    .update({ is_active: p.is_active })
    .eq("id", p.id);

  if (error) return json({ error: error.message }, 500);

  return json({ success: true });
}

// ── Helpers ───────────────────────────────────────────────────
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
