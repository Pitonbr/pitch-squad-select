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

  // Send custom welcome email after signup
  const sendConfirmationEmail = async () => {
    if (emailSent) return;
    
    setLoading(true);
    setEmailError(null);
    
    try {
      console.log(`📧 Starting signup process for: ${email}`);
      
      // Step 1: Create user with Supabase Auth (no native email confirmation)
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (signupError) {
        throw new Error(signupError.message);
      }

      if (!data.user) {
        throw new Error("Falha ao criar usuário");
      }

      console.log("✅ User created successfully, sending custom welcome email...");
      
      // Step 2: Send custom welcome email via edge function
      const confirmationUrl = `${window.location.origin}/`;
      
      const emailResult = await sendCustomEmail(
        email,
        confirmationUrl,
        displayName,
        3 // max retries
      );

      if (emailResult.success) {
        console.log("✅ Welcome email sent successfully");
        setEmailSent(true);
        setTimeLeft(60);
        setCanResend(false);
        setRetryCount(0);
        
        toast({
          title: "Cadastro realizado!",
          description: "Email de boas-vindas enviado. Você já pode fazer login!",
        });
        
        // Redirect to success after a short delay
        setTimeout(() => onSuccess(), 2000);
      } else {
        // Email failed but user was created successfully
        console.warn("⚠️ Welcome email failed but user was created:", emailResult.error);
        setEmailError(emailResult.error || "Falha no envio do email");
        
        toast({
          title: "Cadastro realizado!",
          description: "Usuário criado com sucesso, mas houve um problema ao enviar o email de boas-vindas. Você já pode fazer login!",
          duration: 6000,
        });
        
        // Still redirect to success
        setTimeout(() => onSuccess(), 2000);
      }
      
    } catch (error: any) {
      console.error("❌ Error during signup process:", error);
      
      let errorMessage = "Ocorreu um erro inesperado.";
      
      if (error.message?.includes("User already registered")) {
        errorMessage = "Este email já está cadastrado. Tente fazer login.";
      } else if (error.message?.includes("Password should be at least")) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (error.message?.includes("Password is too weak")) {
        errorMessage = "Senha muito fraca. Use uma combinação de letras, números e caracteres especiais.";
      } else if (error.message?.includes("Invalid email")) {
        errorMessage = "Email inválido.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setEmailError(errorMessage);
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
      
      // If it's a password error, allow user to go back and fix it
      if (errorMessage.includes("senha") || errorMessage.includes("Password")) {
        toast({
          title: "💡 Dica",
          description: "Clique em 'Voltar' para ajustar sua senha.",
          duration: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Send initial email on component mount
  useEffect(() => {
    sendConfirmationEmail();
  }, []);

  // No need to check for email confirmation since it's disabled in Supabase
  // User can login immediately after signup

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
        <CardTitle>Cadastro realizado!</CardTitle>
        <CardDescription>
          Email de boas-vindas enviado para<br />
          <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Você já pode fazer login na aplicação!
          </p>
          <p className="text-xs text-muted-foreground">
            Enviamos um email de boas-vindas. Verifique sua caixa de entrada!
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