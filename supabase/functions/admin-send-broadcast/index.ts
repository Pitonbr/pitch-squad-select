import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend    = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase  = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BroadcastPayload {
  broadcast_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated and is master admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: isAdmin } = await userClient.rpc("is_master_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as BroadcastPayload;
    if (!body.broadcast_id) {
      return new Response(JSON.stringify({ error: "broadcast_id é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch broadcast record
    const { data: broadcast, error: fetchErr } = await supabase
      .from("admin_broadcasts")
      .select("*")
      .eq("id", body.broadcast_id)
      .single();

    if (fetchErr || !broadcast) {
      return new Response(JSON.stringify({ error: "Comunicado não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (broadcast.status === "sent") {
      return new Response(JSON.stringify({ error: "Comunicado já foi enviado" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as sending
    await supabase
      .from("admin_broadcasts")
      .update({ status: "sending" })
      .eq("id", broadcast.id);

    // Fetch recipient emails based on target
    const emails = await getRecipientEmails(broadcast.target);

    let sent = 0;
    let failed = 0;

    if (broadcast.channels.includes("email") && emails.length > 0) {
      // Send in batches of 50 (Resend batch limit)
      const BATCH = 50;
      for (let i = 0; i < emails.length; i += BATCH) {
        const batch = emails.slice(i, i + BATCH);
        try {
          await resend.emails.send({
            from: "Soccer Squad <noreply@soccersquad.com.br>",
            to: batch,
            subject: broadcast.title,
            html: buildEmailHtml(broadcast.title, broadcast.message),
          });
          sent += batch.length;
        } catch (err) {
          console.error("Resend batch error:", err);
          failed += batch.length;
        }
      }
    }

    const finalStatus = failed > 0 && sent === 0 ? "failed" : "sent";

    await supabase
      .from("admin_broadcasts")
      .update({
        status: finalStatus,
        sent_at: new Date().toISOString(),
        recipient_count: sent,
      })
      .eq("id", broadcast.id);

    return new Response(
      JSON.stringify({ success: true, sent, failed, status: finalStatus }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("admin-send-broadcast error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getRecipientEmails(target: string): Promise<string[]> {
  if (target === "all") {
    const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    return (data?.users ?? [])
      .map((u) => u.email)
      .filter((e): e is string => !!e);
  }

  // admins = users who are admin_id in at least one team
  // players = users who are NOT admin_id in any team
  const { data: teams } = await supabase
    .from("teams")
    .select("admin_id");

  const adminIds = new Set((teams ?? []).map((t: { admin_id: string }) => t.admin_id));

  const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const users = allUsers?.users ?? [];

  if (target === "admins") {
    return users
      .filter((u) => adminIds.has(u.id))
      .map((u) => u.email)
      .filter((e): e is string => !!e);
  }

  // players = users without a team they admin
  return users
    .filter((u) => !adminIds.has(u.id))
    .map((u) => u.email)
    .filter((e): e is string => !!e);
}

function buildEmailHtml(title: string, message: string): string {
  const escaped = message.replace(/\n/g, "<br>");
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:#10b981;padding:24px 32px;">
            <p style="margin:0;color:#fff;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Soccer Squad</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">${title}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;color:#cbd5e1;font-size:15px;line-height:1.7;">
            ${escaped}
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;">
            <a href="https://soccersquad.com.br" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Abrir Soccer Squad</a>
          </td>
        </tr>
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
