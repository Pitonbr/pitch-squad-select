import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { GameConfirmationEmail } from "./_templates/game-confirmation-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GameConfirmationRequest {
  email: string;
  playerName: string;
  gameTitle: string;
  gameDate: string;
  gameTime: string;
  gameLocation: string;
  confirmationStatus: "confirmed" | "declined";
  teamName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      playerName,
      gameTitle,
      gameDate,
      gameTime,
      gameLocation,
      confirmationStatus,
      teamName,
    }: GameConfirmationRequest = await req.json();

    console.log("Sending game confirmation email to:", email);

    if (!email || !email.includes('@')) {
      throw new Error("Email inválido");
    }

    // Render the email template
    const html = await renderAsync(
      React.createElement(GameConfirmationEmail, {
        playerName,
        gameTitle,
        gameDate,
        gameTime,
        gameLocation,
        confirmationStatus,
        teamName,
      })
    );

    const customDomain = Deno.env.get("CUSTOM_EMAIL_DOMAIN");
    const fromEmail = customDomain 
      ? `Soccer Squad <adm@${customDomain}>`
      : "Soccer Squad <onboarding@resend.dev>";

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: confirmationStatus === "confirmed" 
        ? `✅ Presença Confirmada - ${gameTitle}`
        : `❌ Ausência Registrada - ${gameTitle}`,
      html,
    });

    if (emailResponse.error) {
      console.error("Resend error in send-game-confirmation:", emailResponse.error);
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

    console.log("Game confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-game-confirmation function:", error);
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
