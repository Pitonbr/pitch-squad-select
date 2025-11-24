import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { ResetPasswordEmail } from "./_templates/reset-password-email.tsx";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

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

    // Check if user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    if (userError || !userData.user) {
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

    // Generate password reset token
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (resetError || !resetData) {
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
