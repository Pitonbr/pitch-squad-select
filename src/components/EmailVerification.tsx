import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, RefreshCw, CheckCircle } from "lucide-react";

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
  const { toast } = useToast();

  // Timer for resend button
  useEffect(() => {
    if (timeLeft > 0 && emailSent) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, emailSent]);

  // Send confirmation email
  const sendConfirmationEmail = async () => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
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

      if (error) throw error;

      // Send custom email
      if (data.user && !data.user.email_confirmed_at) {
        const confirmationUrl = `${window.location.origin}/auth?confirm=true`;
        
        try {
          await supabase.functions.invoke("send-custom-email", {
            body: {
              to: email,
              confirmationUrl,
              displayName,
            },
          });
        } catch (emailError) {
          console.warn("Custom email failed, fallback to Supabase default:", emailError);
        }
      }

      setEmailSent(true);
      setTimeLeft(60);
      setCanResend(false);

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para confirmar o cadastro.",
      });
    } catch (error: any) {
      console.error("Error during signup:", error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
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
            onClick={sendConfirmationEmail}
            disabled={!canResend || loading}
            className="w-full"
          >
            {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            {canResend ? "Reenviar Email" : `Reenviar em ${timeLeft}s`}
          </Button>

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