import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { PaymentReminderEmail } from "./_templates/payment-reminder-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaymentReminderRequest {
  email: string;
  playerName: string;
  teamName: string;
  paymentType: "monthly" | "game";
  amount: number;
  dueDate?: string;
  periodMonth?: number;
  periodYear?: number;
  gameTitle?: string;
  gameDate?: string;
  paymentLink?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      playerName,
      teamName,
      paymentType,
      amount,
      dueDate,
      periodMonth,
      periodYear,
      gameTitle,
      gameDate,
      paymentLink,
    }: PaymentReminderRequest = await req.json();

    console.log("Sending payment reminder email to:", email);

    if (!email || !email.includes('@')) {
      throw new Error("Email inválido");
    }

    if (!amount || amount <= 0) {
      throw new Error("Valor do pagamento inválido");
    }

    // Render the email template
    const html = await renderAsync(
      React.createElement(PaymentReminderEmail, {
        playerName,
        teamName,
        paymentType,
        amount,
        dueDate,
        periodMonth,
        periodYear,
        gameTitle,
        gameDate,
        paymentLink,
      })
    );

    const customDomain = Deno.env.get("CUSTOM_EMAIL_DOMAIN");
    const fromEmail = customDomain 
      ? `Soccer Squad <adm@${customDomain}>`
      : "Soccer Squad <onboarding@resend.dev>";

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: `💰 Lembrete de Pagamento - ${formatCurrency(amount)}`,
      html,
    });

    if (emailResponse.error) {
      console.error("Resend error in send-payment-reminder:", emailResponse.error);
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

    console.log("Payment reminder email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-payment-reminder function:", error);
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
