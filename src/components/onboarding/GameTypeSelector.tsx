// ============================================================
// src/components/onboarding/GameTypeSelector.tsx
// Tela B.3.3 — Tipo de jogo preferido
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { GamePreferences, GameType, GAME_TYPE_INFO } from "@/types/onboarding";
import { Search } from "lucide-react";

interface GameTypeSelectorProps {
  initial?: Partial<GamePreferences>;
  onNext: (data: GamePreferences) => void;
  onBack: () => void;
}

const TYPES: GameType[] = ["campo", "society", "futsal", "beach"];

export function GameTypeSelector({ initial = {}, onNext, onBack }: GameTypeSelectorProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<GameType[]>(initial.game_types ?? []);

  const toggle = (t: GameType) =>
    setSelected(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSearch = () => {
    if (selected.length === 0) {
      toast({ title: "Selecione ao menos um tipo de jogo", variant: "destructive" }); return;
    }
    onNext({ game_types: selected });
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Qual formato você prefere?</h2>
        <p className="text-sm text-muted-foreground">Pode escolher mais de um</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TYPES.map(t => {
          const info = GAME_TYPE_INFO[t];
          const active = selected.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className={cn(
                "relative p-5 rounded-2xl border-2 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.97]",
                active
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              {active && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">✓</span>
              )}
              <div className="text-3xl mb-2">{info.emoji}</div>
              <p className={cn("font-semibold text-sm", active ? "text-primary" : "text-foreground")}>
                {info.label}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{info.description}</p>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          {selected.length} tipo{selected.length > 1 ? "s" : ""} selecionado{selected.length > 1 ? "s" : ""}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
        <Button className="flex-1 gap-2" onClick={handleSearch}>
          <Search className="h-4 w-4" /> Buscar jogos
        </Button>
      </div>
    </div>
  );
}
