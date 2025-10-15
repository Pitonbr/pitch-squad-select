import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface WhatsAppRequest {
  phone: string;
  displayName?: string;
  action: "send_code" | "verify_code";
  code?: string;
  verificationId?: string;
}

// Generate random 6-digit code
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validate phone number
const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
};

// Sanitize input
const sanitizeInput = (input: string, maxLength: number = 255): string => {
  return input.trim().substring(0, maxLength);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, displayName, action, code, verificationId }: WhatsAppRequest = await req.json();

    // Validate phone
    if (!phone || !validatePhone(phone)) {
      return new Response(
        JSON.stringify({ success: false, error: "Número de telefone inválido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sanitizedPhone = sanitizeInput(phone, 20);
    const sanitizedName = sanitizeInput(displayName || "Usuário", 100);

    if (action === "send_code") {
      console.log(`📱 Sending WhatsApp verification code to ${sanitizedPhone}`);

      // Generate verification code
      const verificationCode = generateCode();
      const newVerificationId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store verification code in database
      const { error: dbError } = await supabase
        .from("whatsapp_verification_codes")
        .insert({
          id: newVerificationId,
          phone: sanitizedPhone,
          code: verificationCode,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
        });

      if (dbError) {
        console.error("❌ Database error:", dbError);
        return new Response(
          JSON.stringify({ success: false, error: "Erro ao armazenar código" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Send WhatsApp message using WhatsApp Business API
      const whatsappToken = Deno.env.get("WHATSAPP_API_TOKEN");
      const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

      if (!whatsappToken || !whatsappPhoneId) {
        console.warn("⚠️ WhatsApp credentials not configured, returning code for testing");
        // In development/testing, return the code
        return new Response(
          JSON.stringify({ 
            success: true, 
            verificationId: newVerificationId,
            // REMOVE THIS IN PRODUCTION - only for testing
            debug_code: verificationCode 
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      try {
        // Send WhatsApp message via Meta WhatsApp Business API
        const whatsappResponse = await fetch(
          `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${whatsappToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: sanitizedPhone.replace(/\D/g, ''), // Remove non-digits
              type: "template",
              template: {
                name: "verification_code", // You must create this template in Meta Business Manager
                language: { code: "pt_BR" },
                components: [
                  {
                    type: "body",
                    parameters: [
                      { type: "text", text: sanitizedName },
                      { type: "text", text: verificationCode }
                    ]
                  }
                ]
              }
            }),
          }
        );

        if (!whatsappResponse.ok) {
          const errorData = await whatsappResponse.json();
          console.error("❌ WhatsApp API error:", errorData);
          
          // Update log with failure
          await supabase.from("whatsapp_verification_codes").update({
            status: "failed",
            error_message: JSON.stringify(errorData),
          }).eq("id", newVerificationId);

          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Falha ao enviar mensagem via WhatsApp",
              details: errorData 
            }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const whatsappData = await whatsappResponse.json();
        console.log("✅ WhatsApp message sent:", whatsappData);

        // Update log with success
        await supabase.from("whatsapp_verification_codes").update({
          status: "sent",
          sent_at: new Date().toISOString(),
        }).eq("id", newVerificationId);

        return new Response(
          JSON.stringify({ 
            success: true, 
            verificationId: newVerificationId,
            messageId: whatsappData.messages?.[0]?.id
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );

      } catch (whatsappError: any) {
        console.error("❌ WhatsApp send exception:", whatsappError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Erro ao conectar com WhatsApp API" 
          }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

    } else if (action === "verify_code") {
      console.log(`🔍 Verifying WhatsApp code for ${sanitizedPhone}`);

      if (!code || code.length !== 6) {
        return new Response(
          JSON.stringify({ success: false, error: "Código inválido" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Get verification record
      const { data: verification, error: fetchError } = await supabase
        .from("whatsapp_verification_codes")
        .select("*")
        .eq("phone", sanitizedPhone)
        .eq("code", code)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !verification) {
        console.error("❌ Verification not found or expired:", fetchError);
        
        // Increment attempts if verification exists
        if (verificationId) {
          await supabase.rpc("increment_verification_attempts", { 
            verification_id: verificationId 
          });
        }

        return new Response(
          JSON.stringify({ 
            success: false, 
            verified: false,
            error: "Código inválido ou expirado" 
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check attempts
      if (verification.attempts >= 5) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            verified: false,
            error: "Número máximo de tentativas excedido" 
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Mark as verified
      await supabase
        .from("whatsapp_verification_codes")
        .update({ 
          status: "verified",
          verified_at: new Date().toISOString(),
        })
        .eq("id", verification.id);

      console.log("✅ WhatsApp code verified successfully");

      return new Response(
        JSON.stringify({ 
          success: true, 
          verified: true,
          phone: sanitizedPhone
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Ação inválida" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("❌ Error in send-whatsapp-verification:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro inesperado" 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
