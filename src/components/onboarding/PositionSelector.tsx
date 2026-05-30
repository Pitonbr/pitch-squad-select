// ============================================================
// src/components/onboarding/PositionSelector.tsx
// Seletor visual de posições em campo (máx 2)
// ============================================================

import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { FieldPosition, POSITIONS } from "@/types/onboarding";

interface PositionSelectorProps {
  selected: FieldPosition[];
  onChange: (positions: FieldPosition[]) => void;
}

const ZONE_LABELS = { defense: "Defesa", midfield: "Meio-Campo", attack: "Ataque" };

export function PositionSelector({ selected, onChange }: PositionSelectorProps) {
  const { toast } = useToast();

  const toggle = (code: FieldPosition) => {
    if (selected.includes(code)) {
      onChange(selected.filter(p => p !== code));
      return;
    }
    if (selected.length >= 2) {
      toast({ title: "Máximo 2 posições", description: "Remova uma posição antes de adicionar outra." });
      return;
    }
    onChange([...selected, code]);
  };

  const zones = ["defense", "midfield", "attack"] as const;

  return (
    <div className="space-y-4">
      {zones.map(zone => (
        <div key={zone}>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {ZONE_LABELS[zone]}
          </p>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.filter(p => p.zone === zone).map(pos => {
              const idx = selected.indexOf(pos.code);
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              return (
                <button
                  key={pos.code}
                  type="button"
                  onClick={() => toggle(pos.code)}
                  className={cn(
                    "relative px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    isFirst
                      ? "bg-primary/15 border-primary text-primary"
                      : isSecond
                      ? "bg-primary/8 border-primary/50 border-dashed text-primary/80"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {pos.label}
                  {isFirst && (
                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-[9px] text-white font-bold px-1 rounded-full">
                      1ª
                    </span>
                  )}
                  {isSecond && (
                    <span className="absolute -top-1.5 -right-1.5 bg-primary/60 text-[9px] text-white font-bold px-1 rounded-full">
                      2ª
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selected.length > 0 && (
        <div className="flex items-center gap-3 mt-2 p-3 rounded-xl bg-primary/5 border border-primary/15">
          {selected.map((code, i) => {
            const pos = POSITIONS.find(p => p.code === code);
            return (
              <div key={code} className="flex items-center gap-2 text-sm">
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                  i === 0 ? "bg-primary text-white" : "bg-primary/30 text-primary"
                )}>{i + 1}</span>
                <span className={i === 0 ? "font-semibold text-primary" : "text-primary/70"}>
                  {pos?.label}
                </span>
                {i === 0 && <span className="text-[10px] text-muted-foreground">(Principal)</span>}
                {i === 1 && <span className="text-[10px] text-muted-foreground">(Alternativa)</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
