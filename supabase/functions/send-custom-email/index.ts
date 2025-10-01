import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import React from "https://esm.sh/react@18.3.1";
import { WelcomeEmail } from "./_templates/welcome-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { to, confirmationUrl, displayName, retryAttempt = 0 }: EmailRequest & { retryAttempt?: number } = body;

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

    console.log("📧 Email request received:", { 
      to: sanitizedTo, 
      displayName: sanitizedDisplayName, 
      retryAttempt,
      domain: sanitizedTo.split('@')[1],
      timestamp: new Date().toISOString()
    });

    // Check for common problematic domains and log warnings
    const emailDomain = to.split('@')[1].toLowerCase();
    const problematicDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
    
    if (problematicDomains.includes(emailDomain)) {
      console.warn(`⚠️ Sending to potentially problematic domain: ${emailDomain}. Using enhanced delivery settings.`);
    }

    // Render the email template
    console.log("🔄 Rendering email template...");
    const html = await renderAsync(
      React.createElement(WelcomeEmail, {
        confirmationUrl,
        displayName: sanitizedDisplayName,
      })
    );

    console.log("✅ Email template rendered successfully");

    // Enhanced email sending with better configuration
    const emailDomain = sanitizedTo.split('@')[1].toLowerCase();
    const emailRequest = {
      from: "Soccer Manager <noreply@resend.dev>",
      to: [sanitizedTo],
      subject: "⚽ Bem-vindo ao Soccer Manager - Confirme seu cadastro",
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

    console.log("📤 Sending email via Resend...", { 
      to: emailRequest.to, 
      subject: emailRequest.subject,
      tags: emailRequest.tags
    });

    const emailResponse = await resend.emails.send(emailRequest);

    if (emailResponse.error) {
      throw new Error(`Resend API error: ${emailResponse.error.message}`);
    }

    console.log("✅ Email sent successfully:", {
      id: emailResponse.data?.id,
      to,
      domain: emailDomain,
      retryAttempt
    });

    return new Response(JSON.stringify({
      success: true,
      id: emailResponse.data?.id,
      message: "Email enviado com sucesso",
      domain: emailDomain,
      retryAttempt
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in send-custom-email function:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Determine if this is a retryable error
    const isRetryable = error.message.includes('rate limit') || 
                       error.message.includes('timeout') ||
                       error.message.includes('temporary');

    return new Response(
      JSON.stringify({ 
        error: error.message,
        retryable: isRetryable,
        timestamp: new Date().toISOString()
      }),
      {
        status: isRetryable ? 429 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);