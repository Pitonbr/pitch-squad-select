import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppSendResult {
  success: boolean;
  error?: string;
  verificationId?: string;
}

interface WhatsAppVerifyResult {
  success: boolean;
  error?: string;
  user?: any;
}

export const useWhatsAppService = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendWhatsAppCode = async (
    phone: string,
    displayName: string
  ): Promise<WhatsAppSendResult> => {
    console.log(`📱 Sending WhatsApp verification code to ${phone}`);
    
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke("send-whatsapp-verification", {
        body: {
          phone,
          displayName,
          action: "send_code",
        },
      });

      if (error) {
        console.error("❌ WhatsApp send error:", error);
        return { 
          success: false, 
          error: error.message || "Falha ao enviar código via WhatsApp" 
        };
      }

      if (data?.success) {
        console.log("✅ WhatsApp code sent successfully");
        // Store verification ID in sessionStorage for later verification
        if (data.verificationId) {
          sessionStorage.setItem(`whatsapp_verification_${phone}`, data.verificationId);
        }
        return { success: true, verificationId: data.verificationId };
      }

      return { 
        success: false, 
        error: data?.error || "Falha ao enviar código" 
      };
      
    } catch (error: any) {
      console.error("❌ WhatsApp send exception:", error);
      return { 
        success: false, 
        error: error.message || "Erro inesperado ao enviar código" 
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (
    code: string,
    phone: string,
    email: string,
    password: string,
    displayName: string,
    inviteCode?: string
  ): Promise<WhatsAppVerifyResult> => {
    console.log(`🔍 Verifying WhatsApp code for ${phone}`);

    try {
      setLoading(true);

      // Get stored verification ID
      const verificationId = sessionStorage.getItem(`whatsapp_verification_${phone}`);

      const { data, error } = await supabase.functions.invoke("send-whatsapp-verification", {
        body: {
          phone,
          code,
          verificationId,
          action: "verify_code",
        },
      });

      if (error) {
        console.error("❌ WhatsApp verify error:", error);
        return { 
          success: false, 
          error: error.message || "Falha na verificação do código" 
        };
      }

      if (data?.success && data?.verified) {
        console.log("✅ WhatsApp code verified successfully");

        // Create Supabase auth user
        console.log("🔐 Creating Supabase user...");
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              display_name: displayName,
              phone,
              invite_code: inviteCode,
              verified_via: "whatsapp",
              email_confirmed: true, // Mark as confirmed since verified via WhatsApp
            },
          },
        });

        if (signUpError) {
          console.error("❌ Supabase signup error:", signUpError);
          return { 
            success: false, 
            error: signUpError.message 
          };
        }

        console.log("✅ User created successfully via WhatsApp verification");
        
        // Clean up verification ID
        sessionStorage.removeItem(`whatsapp_verification_${phone}`);
        
        return { success: true, user: authData.user };
      }

      return { 
        success: false, 
        error: data?.error || "Código inválido ou expirado" 
      };
      
    } catch (error: any) {
      console.error("❌ WhatsApp verify exception:", error);
      return { 
        success: false, 
        error: error.message || "Erro inesperado ao verificar código" 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendWhatsAppCode,
    verifyCode,
    loading,
  };
};
