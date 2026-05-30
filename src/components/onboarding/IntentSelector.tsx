// ============================================================
// src/components/onboarding/IntentSelector.tsx
// Tela B.2 — O que você quer fazer?
// ============================================================

import { PlayerIntent } from "@/types/onboarding";
import { cn } from "@/lib/utils";

interface IntentSelectorProps {
  onSelect: (intent: PlayerIntent) => void;
}

const OPTIONS: { intent: PlayerIntent; emoji: string; title: string; description: string; color: string }[] = [
  {
    intent: "find_game",
    emoji: "⚽",
    title: "Quero jogar",
    description: "Encontre times e jogos próximos a você, já abertos a novos jogadores",
    color: "hover:border-primary/60 hover:bg-primary/5",
  },
  {
    intent: "create_team",
    emoji: "🏆",
    title: "Quero criar meu time",
    description: "Monte seu elenco, agende jogos e gerencie tudo em um só lugar",
    color: "hover:border-amber-500/60 hover:bg-amber-500/5",
  },
];

export function IntentSelector({ onSelect }: IntentSelectorProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">Pronto para jogar!</h2>
        <p className="text-muted-foreground text-sm">O que você quer fazer agora?</p>
      </div>

      <div className="space-y-4">
        {OPTIONS.map(opt => (
          <button
            key={opt.intent}
            type="button"
            onClick={() => onSelect(opt.intent)}
            className={cn(
              "w-full text-left p-5 rounded-2xl border-2 border-border bg-card transition-all duration-200 group",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              "active:scale-[0.98]",
              opt.color,
            )}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-105 transition-transform">
                {opt.emoji}
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">{opt.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{opt.description}</p>
              </div>
              <span className="ml-auto text-muted-foreground text-xl group-hover:translate-x-1 transition-transform">›</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
