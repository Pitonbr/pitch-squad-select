import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BroadcastRequest {
  teamId: string;
  subject: string;
  message: string;
  recipientType: "all" | "players" | "admins";
}

// Input validation
function validateInput(body: BroadcastRequest): { valid: boolean; error?: string } {
  if (!body.teamId || typeof body.teamId !== "string") {
    return { valid: false, error: "Team ID é obrigatório" };
  }

  if (!body.subject || typeof body.subject !== "string" || body.subject.trim().length < 3) {
    return { valid: false, error: "Assunto deve ter pelo menos 3 caracteres" };
  }

  if (body.subject.length > 200) {
    return { valid: false, error: "Assunto muito longo (máximo 200 caracteres)" };
  }

  if (!body.message || typeof body.message !== "string" || body.message.trim().length < 10) {
    return { valid: false, error: "Mensagem deve ter pelo menos 10 caracteres" };
  }

  if (body.message.length > 5000) {
    return { valid: false, error: "Mensagem muito longa (máximo 5000 caracteres)" };
  }

  if (!["all", "players", "admins"].includes(body.recipientType)) {
    return { valid: false, error: "Tipo de destinatário inválido" };
  }

  return { valid: true };
}

// Sanitize input
function sanitizeInput(input: string, maxLength: number): string {
  return input.trim().substring(0, maxLength);
}

// Get team members based on recipient type
async function getRecipients(teamId: string, recipientType: string, requestingUserId: string) {
  console.log(`📋 Fetching recipients for team ${teamId}, type: ${recipientType}`);

  // First, verify the requesting user is a team admin
  const { data: isAdmin, error: adminCheckError } = await supabase
    .rpc('is_team_admin', {
      _user_id: requestingUserId,
      _team_id: teamId,
    });

  if (adminCheckError || !isAdmin) {
    console.error("❌ Admin check failed:", adminCheckError);
    throw new Error("Acesso negado: apenas administradores podem enviar comunicados");
  }

  console.log("✅ User is team admin, proceeding with recipient fetch");

  let query = supabase
    .from('team_members')
    .select(`
      profile_id,
      role,
      profiles!inner(
        user_id,
        display_name
      )
    `)
    .eq('team_id', teamId);

  // Filter by recipient type
  if (recipientType === "players") {
    query = query.eq('role', 'player');
  } else if (recipientType === "admins") {
    query = query.eq('role', 'admin');
  }

  const { data: members, error } = await query;

  if (error) {
    console.error("❌ Error fetching team members:", error);
    throw error;
  }

  // Get email addresses from auth.users
  const recipients = [];
  for (const member of members || []) {
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(
      member.profiles.user_id
    );

    if (user?.user && user.user.email) {
      recipients.push({
        email: user.user.email,
        name: member.profiles.display_name || "Membro",
        role: member.role,
      });
    }
  }

  console.log(`✅ Found ${recipients.length} recipients`);
  return recipients;
}

const handler = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ User authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body: BroadcastRequest = await req.json();

    // Validate inputs
    const validation = validateInput(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sanitizedSubject = sanitizeInput(body.subject, 200);
    const sanitizedMessage = sanitizeInput(body.message, 5000);

    console.log(`📧 Starting broadcast for team ${body.teamId}`);

    // Get recipients
    const recipients = await getRecipients(body.teamId, body.recipientType, user.id);

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum destinatário encontrado" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get team info
    const { data: team } = await supabase
      .from('teams')
      .select('name')
      .eq('id', body.teamId)
      .single();

    const teamName = team?.name || "Soccer Squad";

    // Determine "from" email based on configuration
    const customDomain = Deno.env.get("CUSTOM_EMAIL_DOMAIN");
    const fromEmail = customDomain 
      ? `${teamName} <adm@${customDomain}>`
      : `${teamName} <onboarding@resend.dev>`;

    console.log(`📤 Sending from: ${fromEmail} to ${recipients.length} recipients`);

    // Send emails
    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #3FB8AF 0%, #7DE2D1 100%); 
                          padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .header h1 { color: white; margin: 0; font-size: 24px; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
                .message { white-space: pre-wrap; }
                .footer { background: #f9fafb; padding: 20px; text-align: center; 
                         border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⚽ ${teamName}</h1>
                </div>
                <div class="content">
                  <p>Olá <strong>${recipient.name}</strong>,</p>
                  <p>Você recebeu um comunicado importante do time:</p>
                  <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 20px 0;">
                  <div class="message">${sanitizedMessage}</div>
                  <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 20px 0;">
                </div>
                <div class="footer">
                  <p>© 2025 Soccer Squad - ${teamName}</p>
                  <p>Este é um email automático do sistema de gerenciamento do time.</p>
                </div>
              </div>
            </body>
          </html>
        `;

        const emailResponse = await resend.emails.send({
          from: fromEmail,
          to: [recipient.email],
          subject: `⚽ ${sanitizedSubject}`,
          html: emailHtml,
          headers: {
            'X-Entity-Ref-ID': `broadcast-${body.teamId}-${Date.now()}`,
          },
          tags: [
            { name: 'type', value: 'team-broadcast' },
            { name: 'team_id', value: body.teamId },
            { name: 'recipient_type', value: body.recipientType }
          ]
        });

        if (emailResponse.error) {
          console.error(`❌ Failed to send to ${recipient.email}:`, emailResponse.error);
          failedCount++;
          errors.push(`${recipient.email}: ${emailResponse.error.message}`);
        } else {
          console.log(`✅ Email sent to ${recipient.email}`);
          sentCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`❌ Error sending to ${recipient.email}:`, error);
        failedCount++;
        errors.push(`${recipient.email}: ${error.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Broadcast completed in ${duration}ms: ${sentCount} sent, ${failedCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      sentCount,
      failedCount,
      totalRecipients: recipients.length,
      errors: errors.length > 0 ? errors : undefined,
      duration
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error in send-team-broadcast (${duration}ms):`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao enviar emails",
        timestamp: new Date().toISOString(),
        duration
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
