// ============================================================
// src/pages/PaymentSuccess.tsx
// Página de retorno após pagamento Stripe bem-sucedido
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Home } from "lucide-react";

type PaymentType = "subscription" | "join_fee" | "matchup_fee" | string;

const MESSAGES: Record<string, { title: string; description: string; emoji: string }> = {
  subscription: {
    emoji: "🏆",
    title: "Assinatura ativada!",
    description: "Seu time está pronto. Os 30 dias de teste começam agora — aproveite todos os recursos.",
  },
  join_fee: {
    emoji: "⚽",
    title: "Entrada confirmada!",
    description: "Pagamento recebido. Você agora faz parte do time e aparecerá nas convocações.",
  },
  matchup_fee: {
    emoji: "⚔️",
    title: "Desafio confirmado!",
    description: "Pagamento recebido. A partida está confirmada — prepare o time!",
  },
};

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();
  const [countdown, setCountdown] = useState(5);

  const type    = searchParams.get("type") as PaymentType ?? "subscription";
  const msg     = MESSAGES[type] ?? MESSAGES.subscription;

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); navigate("/", { replace: true }); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [navigate]);

  return (
    <div className="min-h-screen stadium-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        {/* Green top bar */}
        <div className="h-2 bg-gradient-to-r from-primary to-green-400" />

        <div className="p-8 text-center space-y-5">
          {/* Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-4xl">
              {msg.emoji}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-md">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold">{msg.title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{msg.description}</p>
          </div>

          <Button className="w-full gap-2" onClick={() => navigate("/", { replace: true })}>
            <Home className="h-4 w-4" /> Ir para o dashboard
          </Button>

          <p className="text-xs text-muted-foreground">
            Redirecionando automaticamente em {countdown}s...
          </p>
        </div>
      </div>
    </div>
  );
}
