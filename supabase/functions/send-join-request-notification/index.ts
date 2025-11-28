import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import React from "https://esm.sh/react@18.3.1";
import { ApprovalEmail } from "./_templates/approval-email.tsx";
import { RejectionEmail } from "./_templates/rejection-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string;
  action: 'approve' | 'reject';
  playerName: string;
  teamName: string;
  gameTitle?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: NotificationRequest = await req.json();
    const { to, action, playerName, teamName, gameTitle } = body;

    console.log(`📧 Preparing to send ${action} notification to ${to}`);

    // Determine "from" email based on configuration
    const customDomain = Deno.env.get("CUSTOM_EMAIL_DOMAIN");
    const fromEmail = customDomain 
      ? `Soccer Squad <adm@${customDomain}>`
      : "Soccer Squad <onboarding@resend.dev>";

    let html: string;
    let subject: string;

    if (action === 'approve') {
      subject = "✅ Você foi aprovado no time!";
      html = await renderAsync(
        React.createElement(ApprovalEmail, {
          playerName,
          teamName,
          gameTitle,
          dashboardUrl: `https://${Deno.env.get("SUPABASE_URL")?.replace('https://', '')}`
        })
      );
    } else {
      subject = "❌ Solicitação de entrada no time";
      html = await renderAsync(
        React.createElement(RejectionEmail, {
          playerName,
          teamName,
          gameTitle
        })
      );
    }

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
      tags: [
        { name: 'type', value: 'team-join-notification' },
        { name: 'action', value: action }
      ]
    });

    if (emailResponse.error) {
      throw new Error(`Resend API error: ${emailResponse.error.message}`);
    }

    console.log(`✅ Notification email sent successfully:`, emailResponse.data?.id);

    return new Response(JSON.stringify({
      success: true,
      id: emailResponse.data?.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error(`❌ Error sending notification:`, error.message);

    return new Response(
      JSON.stringify({ 
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
