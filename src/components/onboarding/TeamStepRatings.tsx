// ============================================================
// src/components/onboarding/TeamStepRatings.tsx
// Wizard de time — Etapa 4/5: Avaliações
// Espelha a tela "Avaliações" do Chega+: prazo configurável (slider
// + presets) e escala de notas (5 ou 10) com preview ao vivo.
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ChevronRight, Star, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RATING_WINDOW_PRESETS, TeamFormData } from "@/types/onboarding";
import { WizardProgress } from "./WizardProgress";

interface TeamStepRatingsProps {
  initial?: Partial<TeamFormData>;
  onNext: (data: Partial<TeamFormData>) => void;
  onBack: () => void;
}

export function TeamStepRatings({ initial = {}, onNext, onBack }: TeamStepRatingsProps) {
  const [windowHours, setWindowHours] = useState(initial.rating_window_hours ?? 6);
  const [scale, setScale] = useState<5 | 10>(initial.rating_scale ?? 10);
  const previewValue = scale === 10 ? 7 : 4;

  const handleNext = () => onNext({ rating_window_hours: windowHours, rating_scale: scale });

  return (
    <div className="w-full max-w-md mx-auto">
      <WizardProgress step={4} total={5} label="Avaliações" />

      <div className="space-y-7">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Como avaliar os jogadores?</h2>
          <p className="text-sm text-muted-foreground">
            Após cada pelada, jogadores podem avaliar uns aos outros. Configure como isso funciona.
          </p>
        </div>

        {/* Prazo */}
        <div className="space-y-3">
          <Label>Tempo para avaliar</Label>
          <p className="text-xs text-muted-foreground">Quanto tempo após o fim da pelada os jogadores têm para dar suas notas?</p>

          <div className="flex justify-center">
            <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm">
              {windowHours} hora{windowHours !== 1 ? "s" : ""}
            </span>
          </div>

          <Slider min={2} max={23} step={1} value={[windowHours]} onValueChange={([v]) => setWindowHours(v)} className="py-1" />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>2h</span><span>23h</span>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sugestões</p>
            {RATING_WINDOW_PRESETS.map(preset => (
              <button
                key={preset.hours}
                type="button"
                onClick={() => setWindowHours(preset.hours)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                  windowHours === preset.hours ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span className="text-xl">{preset.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{preset.label} <span className="text-muted-foreground font-normal">({preset.hours}h)</span></p>
                  <p className="text-xs text-muted-foreground leading-snug">{preset.description}</p>
                </div>
                {windowHours === preset.hours && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Sistema de estrelas */}
        <div className="space-y-3">
          <Label>Sistema de notas</Label>
          <div className="grid grid-cols-2 gap-2">
            {([10, 5] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setScale(s)}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all",
                  scale === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                )}
              >
                <Star className="h-4 w-4" />
                {s} notas {s === 10 ? "(mais preciso)" : "(mais simples)"}
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
            <p className="text-xs text-muted-foreground">Preview da avaliação:</p>
            <div className="flex items-center gap-1">
              {Array.from({ length: scale }, (_, i) => (
                <Star key={i} className={cn("h-4 w-4", i < previewValue ? "fill-primary text-primary" : "text-muted-foreground/30")} />
              ))}
              <span className="ml-2 text-sm font-bold text-primary">{previewValue}/{scale}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button type="button" variant="outline" onClick={onBack}>← Voltar</Button>
        <Button className="flex-1 gap-1" onClick={handleNext}>
          Continuar <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
