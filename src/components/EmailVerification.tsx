import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { useEmailService } from "@/hooks/useEmailService";

interface EmailVerificationProps {
  email: string;
  password: string;
  displayName: string;
  inviteCode?: string;
  onSuccess: () => void;
  onBack: () => void;
}

export const EmailVerification = ({
  email,
  password,
  displayName,
  inviteCode,
  onSuccess,
  onBack,
}: EmailVerificationProps) => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const { sendCustomEmail, sendSupabaseAuthEmail } = useEmailService();

  // Timer for resend button
  useEffect(() => {
    if (timeLeft > 0 && emailSent) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, emailSent]);

  // Enhanced email sending with better error handling
  const sendConfirmationEmail = async () => {
    setLoading(true);
    setEmailError(null);
    
    try {
      console.log(`📧 Starting email verification process for: ${email}`);
      
      // First, handle Supabase auth signup
      const authData = await sendSupabaseAuthEmail(email, password, displayName, inviteCode);
      
      if (authData.user && !authData.user.email_confirmed_at) {
        console.log("👤 User created, sending custom confirmation email...");
        
        const confirmationUrl = `${window.location.origin}/auth?confirm=true`;
        
        // Use enhanced email service
        const emailResult = await sendCustomEmail(email, confirmationUrl, displayName);
        
        if (emailResult.success) {
          setEmailSent(true);
          setTimeLeft(60);
          setCanResend(false);
          setRetryCount(0);
          
          // Domain-specific success messages are handled in useEmailService
        } else {
          // Custom email failed, log but don't fail the whole process
          console.warn("❌ Custom email failed:", emailResult.error);
          setEmailError(emailResult.error || "Falha no envio do email personalizado");
          
          // Still mark as sent since Supabase auth worked
          setEmailSent(true);
          setTimeLeft(60);
          setCanResend(false);
          
          toast({
            title: "Cadastro realizado!",
            description: `Verifique sua caixa de entrada. ${emailResult.error || ''}`,
            variant: emailResult.retryable ? "default" : "destructive",
          });
        }
      } else if (authData.user?.email_confirmed_at) {
        // Email already confirmed
        console.log("✅ Email already confirmed");
        toast({
          title: "Email já confirmado!",
          description: "Redirecionando...",
        });
        setTimeout(onSuccess, 1000);
      }
      
    } catch (error: any) {
      console.error("❌ Error during signup process:", error);
      
      let errorMessage = "Ocorreu um erro inesperado.";
      
      if (error.message?.includes("User already registered")) {
        errorMessage = "Este email já está cadastrado. Tente fazer login.";
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = "Email inválido. Verifique o formato.";
      } else if (error.message?.includes("Password")) {
        errorMessage = "Senha deve ter pelo menos 6 caracteres.";
      }
      
      setEmailError(errorMessage);
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Send initial email on component mount
  useEffect(() => {
    sendConfirmationEmail();
  }, []);

  // Check for email confirmation
  useEffect(() => {
    const checkConfirmation = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        onSuccess();
      }
    };

    // Check immediately
    checkConfirmation();

    // Set up listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        onSuccess();
      }
    });

    return () => subscription.unsubscribe();
  }, [onSuccess]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            {emailSent ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <Mail className="h-6 w-6 text-primary" />
            )}
          </div>
        </div>
        <CardTitle>Confirme seu email</CardTitle>
        <CardDescription>
          Enviamos um link de confirmação para<br />
          <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Clique no link do email para confirmar sua conta.
          </p>
          <p className="text-xs text-muted-foreground">
            Não esqueça de verificar a pasta de spam!
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => {
              setRetryCount(prev => prev + 1);
              sendConfirmationEmail();
            }}
            disabled={!canResend || loading}
            className="w-full"
          >
            {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            {canResend ? `Reenviar Email ${retryCount > 0 ? `(${retryCount + 1}ª tentativa)` : ''}` : `Reenviar em ${timeLeft}s`}
          </Button>

          {/* Error message display */}
          {emailError && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="text-sm text-destructive">
                <p className="font-medium">Problema no envio:</p>
                <p>{emailError}</p>
              </div>
            </div>
          )}

          {/* Domain-specific tips */}
          {email.includes('@gmail.com') && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>💡 Dica para Gmail:</strong> Emails podem demorar até 5 minutos. 
                Verifique também a pasta "Promoções" e "Spam".
              </p>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={onBack}
            className="w-full"
          >
            Voltar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};