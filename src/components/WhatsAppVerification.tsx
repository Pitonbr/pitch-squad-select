import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, MessageSquare, CheckCircle2 } from "lucide-react";
import { useWhatsAppService } from "@/hooks/useWhatsAppService";

interface WhatsAppVerificationProps {
  phone: string;
  email: string;
  password: string;
  displayName: string;
  inviteCode?: string;
  onSuccess: () => void;
  onBack: () => void;
}

export const WhatsAppVerification = ({
  phone,
  email,
  password,
  displayName,
  inviteCode,
  onSuccess,
  onBack,
}: WhatsAppVerificationProps) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();
  const { sendWhatsAppCode, verifyCode } = useWhatsAppService();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  useEffect(() => {
    sendInitialCode();
  }, []);

  const sendInitialCode = async () => {
    console.log(`📱 Sending initial WhatsApp code to ${phone}`);
    
    const result = await sendWhatsAppCode(phone, displayName);
    
    if (!result.success) {
      toast({
        title: "Erro ao enviar código",
        description: result.error || "Não foi possível enviar o código via WhatsApp",
        variant: "destructive",
      });
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Código inválido",
        description: "O código deve ter 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log(`🔍 Verifying WhatsApp code for ${phone}`);

    try {
      const result = await verifyCode(
        verificationCode,
        phone,
        email,
        password,
        displayName,
        inviteCode
      );

      if (result.success) {
        toast({
          title: "Verificação concluída! ✅",
          description: "Sua conta foi criada com sucesso",
        });
        onSuccess();
      } else {
        toast({
          title: "Código inválido",
          description: result.error || "O código informado não é válido",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("❌ WhatsApp verification error:", error);
      toast({
        title: "Erro na verificação",
        description: error.message || "Ocorreu um erro ao verificar o código",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setResendTimer(60);
    
    console.log(`🔄 Resending WhatsApp code to ${phone}`);
    
    const result = await sendWhatsAppCode(phone, displayName);
    
    if (result.success) {
      toast({
        title: "Código reenviado! 📱",
        description: "Um novo código foi enviado via WhatsApp",
      });
    } else {
      toast({
        title: "Erro ao reenviar",
        description: result.error || "Não foi possível reenviar o código",
        variant: "destructive",
      });
      setCanResend(true);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <MessageSquare className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle>Verifique seu WhatsApp</CardTitle>
        <CardDescription>
          Enviamos um código de 6 dígitos para o número <strong>{phone}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código de verificação</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl tracking-widest"
          />
        </div>

        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Dica:</p>
              <p className="text-blue-800">
                Abra o WhatsApp no seu celular e verifique a mensagem que acabamos de enviar.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleVerify}
          disabled={loading || verificationCode.length !== 6}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verificar código
        </Button>

        <Button
          onClick={handleResend}
          disabled={!canResend}
          variant="outline"
          className="w-full"
        >
          {canResend ? "Reenviar código" : `Reenviar em ${resendTimer}s`}
        </Button>

        <Button onClick={onBack} variant="ghost" className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </CardContent>
    </Card>
  );
};
