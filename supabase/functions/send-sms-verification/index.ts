import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequestBody {
  phone: string;
  email: string;
  password: string;
  displayName: string;
}

interface SMSVerifyBody {
  verificationId: string;
  code: string;
}

// Input validation functions
function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
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
    const url = new URL(req.url);
    const path = url.pathname;

    // Request SMS verification
    if (path.endsWith("/request") && req.method === "POST") {
      const body = await req.json();
      const { phone, email, password, displayName }: SMSRequestBody = body;

      // Validate inputs
      if (!phone || !validatePhone(phone)) {
        return new Response(
          JSON.stringify({ error: "Número de telefone inválido" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!email || !validateEmail(email)) {
        return new Response(
          JSON.stringify({ error: "Email inválido" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!password || password.length < 8 || password.length > 72) {
        return new Response(
          JSON.stringify({ error: "Senha deve ter entre 8 e 72 caracteres" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Sanitize inputs
      const sanitizedPhone = sanitizeInput(phone, 20);
      const sanitizedEmail = sanitizeInput(email, 255);
      const sanitizedDisplayName = sanitizeInput(displayName || "User", 100);

      // Log security event (DO NOT LOG CODE)
      console.log("📞 SMS verification request:", { 
        phone_masked: sanitizedPhone.substring(0, 3) + "***", 
        email: sanitizedEmail,
        timestamp: new Date().toISOString() 
      });

      // Request verification using database function
      const { data, error } = await supabase.rpc("request_sms_verification", {
        _phone: sanitizedPhone,
        _email: sanitizedEmail,
        _password: password,
        _display_name: sanitizedDisplayName,
      });

      if (error) {
        console.error("❌ Database error:", error);
        return new Response(
          JSON.stringify({ error: "Erro interno do servidor" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const result = data[0];
      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.message }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Send SMS via Twilio (DO NOT LOG THE CODE)
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        
        const formData = new URLSearchParams();
        formData.append("To", sanitizedPhone);
        formData.append("From", twilioPhoneNumber || "+1234567890");
        formData.append("Body", `⚽ Soccer Manager - Seu código de verificação é: ${result.message}`);

        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(`Twilio error: ${data.message}`);
        }

        console.log("✅ SMS sent successfully to:", sanitizedPhone.substring(0, 3) + "***");

        return new Response(JSON.stringify({ 
          success: true, 
          verificationId: result.verification_id 
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (smsError: any) {
        console.error("❌ SMS sending error:", smsError.message);
        return new Response(
          JSON.stringify({ error: "Erro ao enviar SMS" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Verify SMS code
    if (path.endsWith("/verify") && req.method === "POST") {
      const body = await req.json();
      const { verificationId, code }: SMSVerifyBody = body;

      // Validate inputs
      if (!verificationId || !code) {
        return new Response(
          JSON.stringify({ error: "ID de verificação e código são obrigatórios" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!/^\d{6}$/.test(code)) {
        return new Response(
          JSON.stringify({ error: "Código deve ter 6 dígitos" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Log verification attempt
      console.log("🔐 SMS verification attempt:", { 
        verificationId: verificationId.substring(0, 8) + "***", 
        timestamp: new Date().toISOString() 
      });

      // Verify code using database function
      const { data, error } = await supabase.rpc("verify_sms_code", {
        _verification_id: verificationId,
        _code: code,
      });

      if (error) {
        console.error("❌ Verification error:", error);
        return new Response(
          JSON.stringify({ error: "Erro interno do servidor" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const result = data[0];
      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.message }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Return user data for account creation
      return new Response(JSON.stringify({
        success: true,
        userData: result.user_data,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Endpoint não encontrado" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Error in send-sms-verification function:", error.message);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
