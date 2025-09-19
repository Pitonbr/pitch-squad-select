import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailSendResult {
  success: boolean;
  error?: string;
  retryable?: boolean;
  domain?: string;
}

export const useEmailService = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendCustomEmail = async (
    to: string,
    confirmationUrl: string,
    displayName: string,
    maxRetries = 3
  ): Promise<EmailSendResult> => {
    const emailDomain = to.split('@')[1]?.toLowerCase();
    
    console.log(`📧 Starting email send process for ${to} (domain: ${emailDomain})`);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        setLoading(true);
        
        console.log(`📤 Attempt ${attempt + 1}/${maxRetries} to send email to ${to}`);

        const { data, error } = await supabase.functions.invoke("send-custom-email", {
          body: {
            to,
            confirmationUrl,
            displayName,
            retryAttempt: attempt,
          },
        });

        if (error) {
          console.error(`❌ Edge function error on attempt ${attempt + 1}:`, error);
          
          // Check if this is a retryable error
          if (error.message?.includes('rate limit') || error.message?.includes('timeout')) {
            if (attempt < maxRetries - 1) {
              const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
              console.log(`⏳ Retryable error, waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          
          throw error;
        }

        if (data?.success) {
          console.log(`✅ Email sent successfully on attempt ${attempt + 1}:`, data);
          
          // Show success message with domain-specific tips
          if (emailDomain === 'gmail.com') {
            toast({
              title: "Email enviado!",
              description: "Verifique sua caixa de entrada e pasta de spam. Emails do Gmail podem demorar alguns minutos.",
            });
          } else {
            toast({
              title: "Email enviado!",
              description: "Verifique sua caixa de entrada para confirmar o cadastro.",
            });
          }

          return { 
            success: true, 
            domain: emailDomain 
          };
        }

        throw new Error(data?.error || "Falha no envio do email");
        
      } catch (error: any) {
        console.error(`❌ Email send attempt ${attempt + 1} failed:`, error);
        
        if (attempt === maxRetries - 1) {
          // Final attempt failed
          const errorMsg = getDomainSpecificError(emailDomain, error.message);
          
          toast({
            title: "Erro no envio do email",
            description: errorMsg,
            variant: "destructive",
          });

          return { 
            success: false, 
            error: errorMsg,
            retryable: error.message?.includes('rate limit') || error.message?.includes('timeout'),
            domain: emailDomain
          };
        }
        
        // Wait before retry
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } finally {
        setLoading(false);
      }
    }

    return { 
      success: false, 
      error: "Máximo de tentativas excedido",
      domain: emailDomain
    };
  };

  const getDomainSpecificError = (domain: string, originalError: string): string => {
    switch (domain) {
      case 'gmail.com':
        return "Problemas com Gmail detectados. Tente usar outro email ou aguarde alguns minutos.";
      case 'hotmail.com':
      case 'outlook.com':
        return "Problemas com Outlook/Hotmail detectados. Verifique suas configurações de spam.";
      case 'yahoo.com':
        return "Problemas com Yahoo detectados. Verifique sua pasta de spam.";
      default:
        return `Erro no envio: ${originalError}. Tente novamente ou use outro email.`;
    }
  };

  const sendSupabaseAuthEmail = async (
    email: string,
    password: string,
    displayName: string,
    inviteCode?: string
  ): Promise<any> => {
    const redirectUrl = `${window.location.origin}/`;
    
    console.log(`🔐 Sending Supabase auth email for ${email}`);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName,
            invite_code: inviteCode,
          },
        },
      });

      if (error) {
        console.error("❌ Supabase auth error:", error);
        throw error;
      }

      console.log("✅ Supabase auth signup successful:", { 
        hasUser: !!data.user, 
        emailConfirmed: !!data.user?.email_confirmed_at 
      });

      return data;
    } catch (error) {
      console.error("❌ Supabase auth signup failed:", error);
      throw error;
    }
  };

  return {
    sendCustomEmail,
    sendSupabaseAuthEmail,
    loading,
  };
};