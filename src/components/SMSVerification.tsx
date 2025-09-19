import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone, RefreshCw } from "lucide-react";

interface SMSVerificationProps {
  phone: string;
  email: string;
  password: string;
  displayName: string;
  onSuccess: () => void;
  onBack: () => void;
}

export const SMSVerification = ({
  phone,
  email,
  password,
  displayName,
  onSuccess,
  onBack,
}: SMSVerificationProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();

  // Timer for resend button
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Send SMS code
  const sendSMSCode = async () => {
    try {
      setResendLoading(true);
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store code in session storage temporarily
      sessionStorage.setItem("sms_verification_code", verificationCode);
      sessionStorage.setItem("sms_verification_phone", phone);
      
      const response = await supabase.functions.invoke("send-sms-verification", {
        body: { phone, code: verificationCode },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "SMS enviado!",
        description: `Código de verificação enviado para ${phone}`,
      });

      setTimeLeft(60);
      setCanResend(false);
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      toast({
        title: "Erro ao enviar SMS",
        description: "Não foi possível enviar o código. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  // Send initial SMS on component mount
  useEffect(() => {
    sendSMSCode();
  }, []);

  const verifyCode = async () => {
    if (code.length !== 6) return;

    setLoading(true);
    try {
      const storedCode = sessionStorage.getItem("sms_verification_code");
      const storedPhone = sessionStorage.getItem("sms_verification_phone");

      if (!storedCode || !storedPhone || storedPhone !== phone || code !== storedCode) {
        throw new Error("Código inválido ou expirado");
      }

      // Create user account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            phone: phone,
            verified_by_sms: true,
          },
        },
      });

      if (error) throw error;

      // Clear stored verification data
      sessionStorage.removeItem("sms_verification_code");
      sessionStorage.removeItem("sms_verification_phone");

      toast({
        title: "Verificação bem-sucedida!",
        description: "Sua conta foi criada com sucesso.",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error verifying SMS code:", error);
      toast({
        title: "Código inválido",
        description: error.message || "Verifique o código e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Phone className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle>Verificação por SMS</CardTitle>
        <CardDescription>
          Enviamos um código de 6 dígitos para<br />
          <span className="font-medium">{phone}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(value) => setCode(value)}
            onComplete={verifyCode}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="space-y-3">
          <Button
            onClick={verifyCode}
            disabled={code.length !== 6 || loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar Código
          </Button>

          <Button
            variant="outline"
            onClick={sendSMSCode}
            disabled={!canResend || resendLoading}
            className="w-full"
          >
            {resendLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            {canResend ? "Reenviar Código" : `Reenviar em ${timeLeft}s`}
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