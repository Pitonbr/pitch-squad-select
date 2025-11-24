import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { ResetPasswordEmail } from "./_templates/reset-password-email.tsx";
import { RateLimitNotificationEmail } from "./_templates/rate-limit-notification-email.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

// Helper function to send rate limit notification email
const sendRateLimitNotification = async (
  email: string,
  blockedUntil: string,
  attemptCount: number
) => {
  try {
    const html = await renderAsync(
      React.createElement(RateLimitNotificationEmail, {
        blockedUntil,
        attemptCount,
      })
    );

    const customDomain = Deno.env.get("CUSTOM_EMAIL_DOMAIN");
    const fromEmail = customDomain 
      ? `Soccer Squad Security <adm@${customDomain}>`
      : "Soccer Squad Security <onboarding@resend.dev>";

    await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "🔒 Alerta de Segurança - Conta Temporariamente Bloqueada",
      html,
    });

    console.log(`Rate limit notification sent to ${email}`);
  } catch (error) {
    console.error("Error sending rate limit notification:", error);
    // Don't throw - we still want to return success to prevent user enumeration
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    console.log("Password reset requested for:", email);

    if (!email || !email.includes('@')) {
      throw new Error("Email inválido");
    }

    // Create Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get client IP address for rate limiting
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    // Check rate limiting
    const { data: rateLimitData, error: rateLimitError } = await supabaseAdmin
      .from("password_reset_rate_limits")
      .select("*")
      .eq("email", email)
      .single();

    if (!rateLimitError && rateLimitData) {
      const now = new Date();
      const windowStart = new Date(rateLimitData.window_start);
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Check if blocked
      if (rateLimitData.blocked_until && new Date(rateLimitData.blocked_until) > now) {
        console.log(`Email ${email} is blocked until ${rateLimitData.blocked_until}`);
        
        // Send notification email about the block
        await sendRateLimitNotification(email, rateLimitData.blocked_until, rateLimitData.attempt_count);
        
        // Return success to prevent user enumeration
        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Reset window if older than 1 hour
      if (windowStart < hourAgo) {
        await supabaseAdmin
          .from("password_reset_rate_limits")
          .update({
            attempt_count: 1,
            window_start: now.toISOString(),
            blocked_until: null,
          })
          .eq("email", email);
      } else if (rateLimitData.attempt_count >= 5) {
        // Block for 1 hour
        const blockUntil = new Date(now.getTime() + 60 * 60 * 1000);
        await supabaseAdmin
          .from("password_reset_rate_limits")
          .update({
            blocked_until: blockUntil.toISOString(),
          })
          .eq("email", email);

        console.log(`Email ${email} exceeded rate limit, blocked until ${blockUntil}`);
        
        // Send notification email about the new block
        await sendRateLimitNotification(email, blockUntil.toISOString(), rateLimitData.attempt_count);
        
        // Return success to prevent user enumeration
        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      } else {
        // Increment attempt count
        await supabaseAdmin
          .from("password_reset_rate_limits")
          .update({
            attempt_count: rateLimitData.attempt_count + 1,
          })
          .eq("email", email);
      }
    } else {
      // Create new rate limit entry
      await supabaseAdmin
        .from("password_reset_rate_limits")
        .insert({
          email,
          ip_address: clientIp,
          attempt_count: 1,
          window_start: new Date().toISOString(),
        });
    }

    // Check if user exists using listUsers
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      throw new Error("Erro ao verificar usuário");
    }

    const user = users.find((u) => u.email === email);
    
    if (!user) {
      console.log("User not found, but returning success for security");
      // Return success anyway to prevent user enumeration
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("User found, generating reset token");

    // Generate password reset token
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (resetError || !resetData) {
      console.error("Error generating reset token:", resetError);
      throw new Error("Erro ao gerar token de recuperação");
    }

    console.log("Reset token generated successfully");

    // Render the email template with the reset link
    const html = await renderAsync(
      React.createElement(ResetPasswordEmail, {
        resetLink: resetData.properties.action_link,
      })
    );

    const customDomain = Deno.env.get("CUSTOM_EMAIL_DOMAIN");
    const fromEmail = customDomain 
      ? `Soccer Squad <adm@${customDomain}>`
      : "Soccer Squad <onboarding@resend.dev>";

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "Recuperação de Senha - Soccer Squad",
      html,
    });

    // Check if Resend returned an error
    if (emailResponse.error) {
      console.error("Resend error in send-password-reset:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          error: emailResponse.error.message || "Erro ao enviar email",
          details: emailResponse.error 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
