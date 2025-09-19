import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER"); // New env variable for phone

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
      const { phone, email, password, displayName }: SMSRequestBody = await req.json();

      // Log security event
      console.log("SMS verification request:", { 
        phone: phone?.substring(0, 6) + "***", 
        timestamp: new Date().toISOString() 
      });

      // Validate inputs
      if (!phone || !email || !password || !displayName) {
        return new Response(
          JSON.stringify({ error: "Todos os campos são obrigatórios" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Request verification using database function
      const { data, error } = await supabase.rpc("request_sms_verification", {
        _phone: phone,
        _email: email,
        _password: password,
        _display_name: displayName,
      });

      if (error) {
        console.error("Database error:", error);
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

      // Send SMS via Twilio
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        
        const formData = new URLSearchParams();
        formData.append("To", phone);
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

        console.log("SMS sent successfully to:", phone);

        return new Response(JSON.stringify({ 
          success: true, 
          verificationId: result.verification_id 
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (smsError: any) {
        console.error("SMS sending error:", smsError);
        return new Response(
          JSON.stringify({ error: "Erro ao enviar SMS" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Verify SMS code
    if (path.endsWith("/verify") && req.method === "POST") {
      const { verificationId, code }: SMSVerifyBody = await req.json();

      // Log verification attempt
      console.log("SMS verification attempt:", { 
        verificationId: verificationId?.substring(0, 8) + "***", 
        timestamp: new Date().toISOString() 
      });

      if (!verificationId || !code) {
        return new Response(
          JSON.stringify({ error: "ID de verificação e código são obrigatórios" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verify code using database function
      const { data, error } = await supabase.rpc("verify_sms_code", {
        _verification_id: verificationId,
        _code: code,
      });

      if (error) {
        console.error("Verification error:", error);
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
    console.error("Error in send-sms-verification function:", error);
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