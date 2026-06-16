import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend   = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RunPayload { campaign_id: string }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // Auth guard
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: isAdmin } = await userClient.rpc("is_master_admin");
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const { campaign_id } = await req.json() as RunPayload;
    if (!campaign_id) return json({ error: "campaign_id obrigatório" }, 400);

    // Load campaign
    const { data: campaign, error: cErr } = await supabase
      .from("admin_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (cErr || !campaign) return json({ error: "Campanha não encontrada" }, 404);
    if (campaign.status === "completed") return json({ error: "Campanha já concluída" }, 409);

    // Mark as running
    await supabase
      .from("admin_campaigns")
      .update({ status: "running", launched_at: new Date().toISOString() })
      .eq("id", campaign_id);

    // Get audience emails
    const emails = await resolveAudience(campaign.audience_filter);

    let sent = 0, failed = 0;

    if ((campaign.type === "email" || campaign.type === "both") && emails.length > 0) {
      const BATCH = 50;
      for (let i = 0; i < emails.length; i += BATCH) {
        const batch = emails.slice(i, i + BATCH);
        try {
          await resend.emails.send({
            from:    "Soccer Squad <noreply@soccersquad.com.br>",
            to:      batch,
            subject: campaign.subject,
            html:    buildCampaignEmail(campaign),
          });
          sent += batch.length;
        } catch (err) {
          console.error("Email batch failed:", err);
          failed += batch.length;
        }
      }
    }

    const finalStatus = failed > 0 && sent === 0 ? "failed" : "completed";

    await supabase
      .from("admin_campaigns")
      .update({ status: finalStatus, sent_count: sent })
      .eq("id", campaign_id);

    return json({ success: true, sent, failed, total_audience: emails.length });
  } catch (err) {
    console.error("admin-run-campaign error:", err);
    return json({ error: "Erro interno" }, 500);
  }
});

// ── Audience resolution ───────────────────────────────────────
async function resolveAudience(filter: Record<string, unknown>): Promise<string[]> {
  const segment = (filter.segment as string) ?? "all";

  // Fetch all users once
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const allUsers = authData?.users ?? [];

  if (segment === "all") {
    return allUsers.map((u) => u.email).filter((e): e is string => !!e);
  }

  if (segment === "admins") {
    const { data: teams } = await supabase.from("teams").select("admin_id");
    const adminIds = new Set((teams ?? []).map((t: { admin_id: string }) => t.admin_id));
    return allUsers
      .filter((u) => adminIds.has(u.id))
      .map((u) => u.email)
      .filter((e): e is string => !!e);
  }

  if (segment === "players") {
    const { data: teams } = await supabase.from("teams").select("admin_id");
    const adminIds = new Set((teams ?? []).map((t: { admin_id: string }) => t.admin_id));
    return allUsers
      .filter((u) => !adminIds.has(u.id))
      .map((u) => u.email)
      .filter((e): e is string => !!e);
  }

  if (segment === "new_days") {
    const days = Number(filter.days ?? 7);
    const since = new Date(Date.now() - days * 86400_000);
    return allUsers
      .filter((u) => new Date(u.created_at) >= since)
      .map((u) => u.email)
      .filter((e): e is string => !!e);
  }

  if (segment === "inactive_days") {
    const days = Number(filter.days ?? 30);
    const cutoff = new Date(Date.now() - days * 86400_000);
    return allUsers
      .filter((u) => {
        const last = u.last_sign_in_at ? new Date(u.last_sign_in_at) : new Date(u.created_at);
        return last < cutoff;
      })
      .map((u) => u.email)
      .filter((e): e is string => !!e);
  }

  if (segment === "subscription_active") {
    const { data: subs } = await supabase
      .from("team_subscriptions")
      .select("team_id")
      .eq("status", "active");
    const subTeams = new Set((subs ?? []).map((s: { team_id: string }) => s.team_id));
    const { data: teams } = await supabase
      .from("teams")
      .select("admin_id")
      .in("id", [...subTeams]);
    const adminIds = new Set((teams ?? []).map((t: { admin_id: string }) => t.admin_id));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id")
      .in("id", [...adminIds]);
    const userIds = new Set((profiles ?? []).map((p: { user_id: string }) => p.user_id));
    return allUsers
      .filter((u) => userIds.has(u.id))
      .map((u) => u.email)
      .filter((e): e is string => !!e);
  }

  if (segment === "trial") {
    const { data: subs } = await supabase
      .from("team_subscriptions")
      .select("team_id")
      .eq("status", "trialing");
    const subTeams = new Set((subs ?? []).map((s: { team_id: string }) => s.team_id));
    const { data: teams } = await supabase
      .from("teams")
      .select("admin_id")
      .in("id", [...subTeams]);
    const adminIds = new Set((teams ?? []).map((t: { admin_id: string }) => t.admin_id));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id")
      .in("id", [...adminIds]);
    const userIds = new Set((profiles ?? []).map((p: { user_id: string }) => p.user_id));
    return allUsers
      .filter((u) => userIds.has(u.id))
      .map((u) => u.email)
      .filter((e): e is string => !!e);
  }

  // fallback: all
  return allUsers.map((u) => u.email).filter((e): e is string => !!e);
}

// ── Email template ────────────────────────────────────────────
function buildCampaignEmail(c: { subject: string; message: string; cta_url?: string; cta_text?: string; name: string }) {
  const escaped = (c.message ?? "").replace(/\n/g, "<br>");
  const cta = c.cta_url
    ? `<tr><td style="padding:0 32px 32px;">
        <a href="${c.cta_url}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
          ${c.cta_text ?? "Saiba mais"}
        </a>
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#10b981,#0ea5e9);padding:28px 32px;">
            <p style="margin:0;color:rgba(255,255,255,.7);font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Soccer Squad · Campanha</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">${c.subject}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;color:#cbd5e1;font-size:15px;line-height:1.7;">${escaped}</td>
        </tr>
        ${cta}
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #334155;">
            <p style="margin:0;color:#64748b;font-size:12px;">Você recebeu este e-mail como usuário da plataforma Soccer Squad.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
