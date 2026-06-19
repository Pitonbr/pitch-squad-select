// ============================================================
// src/components/onboarding/TeamStepSchedule.tsx
// Wizard de time — Etapa 3/5: Horário dos jogos
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DayOfWeek, DAY_LABELS, TeamFormData } from "@/types/onboarding";
import { WizardProgress } from "./WizardProgress";

interface TeamStepScheduleProps {
  initial?: Partial<TeamFormData>;
  onNext: (data: Partial<TeamFormData>) => void;
  onBack: () => void;
}

const DAYS: DayOfWeek[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

export function TeamStepSchedule({ initial = {}, onNext, onBack }: TeamStepScheduleProps) {
  const { toast } = useToast();
  const [days, setDays] = useState<DayOfWeek[]>(initial.usual_days ?? []);
  const [startTime, setStartTime] = useState(initial.start_time ?? "19:00");
  const [endTime, setEndTime] = useState(initial.end_time ?? "21:00");

  const toggleDay = (d: DayOfWeek) =>
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleNext = () => {
    if (days.length === 0) {
      toast({ title: "Selecione ao menos um dia", variant: "destructive" });
      return;
    }
    if (!startTime || !endTime) {
      toast({ title: "Informe o horário do jogo", variant: "destructive" });
      return;
    }
    onNext({ usual_days: days, start_time: startTime, end_time: endTime });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <WizardProgress step={3} total={5} label="Horário dos jogos" />

      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Quando vocês jogam?</h2>
          <p className="text-sm text-muted-foreground">Escolha os dias e o horário habitual da pelada.</p>
        </div>

        <div className="space-y-2">
          <Label>Dia da semana *</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
                  days.includes(d) ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {DAY_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="stime">Início *</Label>
            <Input id="stime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="etime">Fim *</Label>
            <Input id="etime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
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
