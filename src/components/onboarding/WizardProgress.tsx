// ============================================================
// src/components/onboarding/WizardProgress.tsx
// Stepper visual reutilizável (Etapa X de N + barrinhas de progresso)
// ============================================================

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface WizardProgressProps {
  step: number;
  total: number;
  label: string;
}

export function WizardProgress({ step, total, label }: WizardProgressProps) {
  const progress = (step / total) * 100;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Etapa {step} de {total}
        </p>
        <p className="text-xs text-primary font-medium">{label}</p>
      </div>
      <Progress value={progress} className="h-1.5" />
      <div className="flex gap-1 mt-2">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={cn("flex-1 h-0.5 rounded-full transition-colors", i < step ? "bg-primary" : "bg-border")} />
        ))}
      </div>
    </div>
  );
}
