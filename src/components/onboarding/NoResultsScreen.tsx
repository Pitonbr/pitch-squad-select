// ============================================================
// src/components/onboarding/NoResultsScreen.tsx
// Tela B.3.7 — Nenhum resultado encontrado
// ============================================================

import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Trophy, LayoutDashboard } from "lucide-react";

interface NoResultsScreenProps {
  onAdjustFilters: () => void;
  onCreateTeam: () => void;
  onGoHome: () => void;
}

export function NoResultsScreen({ onAdjustFilters, onCreateTeam, onGoHome }: NoResultsScreenProps) {
  return (
    <div className="w-full max-w-sm mx-auto text-center space-y-6">
      {/* Illustration */}
      <div className="mx-auto w-28 h-28 rounded-full bg-muted/40 flex items-center justify-center">
        <span className="text-5xl">🏟️</span>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold">Nenhum jogo encontrado</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Não encontramos jogos disponíveis em até 5 km na sua região agora.
        </p>
      </div>

      {/* Suggestions */}
      <div className="bg-card border border-border rounded-xl p-4 text-left space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sugestões</p>
        {[
          "Tente ampliar os horários disponíveis",
          "Experimente outro tipo de jogo",
          "Verifique se o bairro está correto",
        ].map(s => (
          <div key={s} className="flex items-start gap-2 text-sm">
            <span className="text-primary mt-0.5">→</span>
            <span className="text-muted-foreground">{s}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Button className="w-full gap-2" onClick={onAdjustFilters}>
          <SlidersHorizontal className="h-4 w-4" /> Ajustar filtros
        </Button>
        <Button variant="outline" className="w-full gap-2" onClick={onCreateTeam}>
          <Trophy className="h-4 w-4" /> Criar meu próprio time
        </Button>
        <button
          type="button"
          onClick={onGoHome}
          className="w-full text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors flex items-center justify-center gap-1.5"
        >
          <LayoutDashboard className="h-4 w-4" />
          Ir para o menu principal mesmo assim
        </button>
      </div>
    </div>
  );
}
