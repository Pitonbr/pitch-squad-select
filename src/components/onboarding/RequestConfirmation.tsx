// ============================================================
// src/components/onboarding/RequestConfirmation.tsx
// Tela B.3.6 — Solicitação enviada com sucesso
// ============================================================

import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import { TeamSearchResult } from "@/types/onboarding";

interface RequestConfirmationProps {
  team: TeamSearchResult | null;
  onGoHome: () => void;
}

export function RequestConfirmation({ team, onGoHome }: RequestConfirmationProps) {
  return (
    <div className="w-full max-w-sm mx-auto text-center space-y-6">
      {/* Animated icon */}
      <div className="relative mx-auto w-24 h-24">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-5xl animate-bounce-gentle">
          📨
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-lg">
          ✓
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Solicitação enviada!</h2>
        {team && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            O administrador do <strong className="text-foreground">{team.name}</strong> recebeu uma notificação
            e irá avaliar seu pedido. Você será avisado assim que a resposta chegar.
          </p>
        )}
      </div>

      {team?.next_game_date && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-xs text-primary/80 font-semibold uppercase tracking-wide mb-1">⚡ Próxima partida do time</p>
          <p className="font-semibold">
            {new Date(team.next_game_date + "T00:00").toLocaleDateString("pt-BR", {
              weekday: "long", day: "2-digit", month: "long"
            })}
            {team.next_game_time ? ` às ${team.next_game_time.slice(0, 5)}` : ""}
          </p>
          {team.next_game_location && (
            <p className="text-sm text-muted-foreground mt-0.5">📍 {team.next_game_location}</p>
          )}
        </div>
      )}

      <Button className="w-full gap-2 h-12" onClick={onGoHome}>
        <LayoutDashboard className="h-5 w-5" />
        Ir para o dashboard
      </Button>
    </div>
  );
}
