// ============================================================
// src/components/onboarding/AvailabilityForm.tsx
// Tela B.3.2 — Disponibilidade: dias, horários, frequência
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AvailabilityPreferences, DayOfWeek, TimeSlot, GamesPerWeek,
  DAY_LABELS, TIME_SLOT_INFO,
} from "@/types/onboarding";

interface AvailabilityFormProps {
  initial?: Partial<AvailabilityPreferences>;
  onNext: (data: AvailabilityPreferences) => void;
  onBack: () => void;
}

const DAYS: DayOfWeek[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const TIMES: TimeSlot[] = ["morning", "afternoon", "evening"];
const GPW: { value: GamesPerWeek; label: string }[] = [
  { value: "1",  label: "1× por semana" },
  { value: "2",  label: "2× por semana" },
  { value: "3+", label: "3× ou mais" },
];

export function AvailabilityForm({ initial = {}, onNext, onBack }: AvailabilityFormProps) {
  const { toast } = useToast();
  const [days, setDays]         = useState<DayOfWeek[]>(initial.days ?? []);
  const [slots, setSlots]       = useState<TimeSlot[]>(initial.time_slots ?? []);
  const [gpw, setGpw]           = useState<GamesPerWeek>(initial.games_per_week ?? "1");

  const toggleDay = (d: DayOfWeek) =>
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const toggleSlot = (s: TimeSlot) =>
    setSlots(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleNext = () => {
    if (days.length === 0) {
      toast({ title: "Selecione ao menos um dia", variant: "destructive" }); return;
    }
    if (slots.length === 0) {
      toast({ title: "Selecione ao menos um horário", variant: "destructive" }); return;
    }
    onNext({ days, time_slots: slots, games_per_week: gpw });
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-7">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Quando você costuma jogar?</h2>
        <p className="text-sm text-muted-foreground">Ajuda a encontrar times com horários compatíveis</p>
      </div>

      {/* Days */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Dias da semana</p>
        <div className="flex gap-2 flex-wrap">
          {DAYS.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={cn(
                "px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
                days.includes(d)
                  ? "bg-primary text-white border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {DAY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Horário preferido</p>
        <div className="grid grid-cols-3 gap-3">
          {TIMES.map(s => {
            const info = TIME_SLOT_INFO[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSlot(s)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm transition-all",
                  slots.includes(s)
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                <span className="text-2xl">{info.emoji}</span>
                <span className="font-semibold">{info.label}</span>
                <span className="text-[10px] opacity-70">{info.range}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Games per week */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Quantas vezes por semana?</p>
        <div className="flex gap-2">
          {GPW.map(g => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGpw(g.value)}
              className={cn(
                "flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                gpw === g.value
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
        <Button className="flex-1 gap-1" onClick={handleNext}>
          Próximo <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
