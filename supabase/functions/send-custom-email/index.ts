import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import React from "https://esm.sh/react@18.3.1";
import { WelcomeEmail } from "./_templates/welcome-email.tsx";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  confirmationUrl: string;
  displayName?: string;
  retryAttempt?: number;
}

// Input validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function sanitizeInput(input: string, maxLength: number = 255): string {
  return input.trim().substring(0, maxLength);
}

const handler = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { to, confirmationUrl, displayName, retryAttempt = 0 }: EmailRequest & { retryAttempt?: number } = body;
    const emailDomain = to?.split('@')[1]?.toLowerCase();

    // Validate inputs
    if (!to || !validateEmail(to)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!confirmationUrl || !validateUrl(confirmationUrl)) {
      return new Response(
        JSON.stringify({ error: "Invalid confirmation URL" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (retryAttempt < 0 || retryAttempt > 5) {
      return new Response(
        JSON.stringify({ error: "Invalid retry attempt" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sanitizedTo = sanitizeInput(to, 255);
    const sanitizedDisplayName = sanitizeInput(displayName || "Jogador", 100);
    const sanitizedConfirmationUrl = sanitizeInput(confirmationUrl, 500);

    console.log(`📧 Preparing to send email to ${sanitizedTo} (domain: ${emailDomain}, attempt ${retryAttempt})`);

    // Log attempt to database
    const logId = crypto.randomUUID();
    await supabase.from("email_delivery_logs").insert({
      id: logId,
      recipient_email: sanitizedTo,
      email_domain: emailDomain,
      attempt_number: retryAttempt,
      status: "attempting",
    });

    // Check for common problematic domains
    const problematicDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
    if (problematicDomains.includes(emailDomain)) {
      console.warn(`⚠️ Sending to potentially problematic domain: ${emailDomain}`);
    }

    // Render the email template
    console.log("🔄 Rendering email template...");
    const html = await renderAsync(
      React.createElement(WelcomeEmail, {
        confirmationUrl: sanitizedConfirmationUrl,
        displayName: sanitizedDisplayName,
      })
    );

    console.log("✅ Email template rendered successfully");

    // Determine "from" email based on configuration
    const customDomain = Deno.env.get("CUSTOM_EMAIL_DOMAIN");
    const fromEmail = customDomain 
      ? `Soccer Squad <noreply@${customDomain}>`
      : "Soccer Squad <onboarding@resend.dev>";

    console.log(`📤 Sending from: ${fromEmail}`);

    // Enhanced email sending with metadata
    const emailRequest = {
      from: fromEmail,
      to: [sanitizedTo],
      subject: "⚽ Bem-vindo ao Soccer Squad - Confirme seu cadastro",
      html,
      headers: {
        'X-Entity-Ref-ID': `soccer-manager-${Date.now()}`,
        'List-Unsubscribe': '<mailto:unsubscribe@resend.dev>',
      },
      tags: [
        { name: 'type', value: 'email-verification' },
        { name: 'domain', value: emailDomain },
        { name: 'retry', value: retryAttempt.toString() }
      ]
    };

    const emailResponse = await resend.emails.send(emailRequest);

    if (emailResponse.error) {
      throw new Error(`Resend API error: ${emailResponse.error.message}`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Email sent successfully via Resend in ${duration}ms:`, emailResponse.data?.id);

    // Update log with success
    await supabase.from("email_delivery_logs").update({
      status: "delivered",
      provider_response: emailResponse.data?.id,
      delivery_time_ms: duration,
    }).eq("id", logId);

    return new Response(JSON.stringify({
      success: true,
      id: emailResponse.data?.id,
      message: "Email enviado com sucesso",
      domain: emailDomain,
      retryAttempt,
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
    console.error(`❌ Error in send-custom-email function (${duration}ms):`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Log error to database if we have the email
    try {
      const body = await req.json().catch(() => ({}));
      const email = body.to;
      const domain = email?.split('@')[1];
      
      if (email) {
        await supabase.from("email_delivery_logs").insert({
          recipient_email: email,
          email_domain: domain,
          status: "failed",
          error_message: error.message,
          delivery_time_ms: duration,
        });
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    // Determine if this is a retryable error
    const isRetryable = error.message?.includes('rate limit') || 
                       error.message?.includes('timeout') ||
                       error.message?.includes('network') ||
                       error.message?.includes('temporary');

    return new Response(
      JSON.stringify({ 
        error: error.message,
        retryable: isRetryable,
        timestamp: new Date().toISOString(),
        duration
      }),
      {
        status: isRetryable ? 429 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
