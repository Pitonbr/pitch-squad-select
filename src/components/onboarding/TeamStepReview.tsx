// ============================================================
// src/components/onboarding/TeamStepReview.tsx
// Wizard de time — Etapa 5/5: Revisão
// ============================================================

import { Button } from "@/components/ui/button";
import { Loader2, Pencil } from "lucide-react";
import { DAY_LABELS, GAME_TYPE_INFO, TeamFormData } from "@/types/onboarding";
import { WizardProgress } from "./WizardProgress";

interface TeamStepReviewProps {
  data: Partial<TeamFormData>;
  onEdit: (step: "create_team_basics" | "create_team_location" | "create_team_schedule" | "create_team_ratings") => void;
  onSubmit: () => void;
  onBack: () => void;
  loading?: boolean;
}

function ReviewCard({ title, onEdit, rows }: { title: string; onEdit: () => void; rows: { label: string; value: string }[] }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <button type="button" onClick={onEdit} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
          <Pencil className="h-3 w-3" /> Editar
        </button>
      </div>
      <div className="space-y-1">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="font-medium text-foreground text-right">{r.value || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamStepReview({ data, onEdit, onSubmit, onBack, loading = false }: TeamStepReviewProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <WizardProgress step={5} total={5} label="Revisão" />

      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Tudo certo?</h2>
          <p className="text-sm text-muted-foreground">Revise as informações do seu grupo antes de criar.</p>
        </div>

        <ReviewCard
          title="Dados do grupo"
          onEdit={() => onEdit("create_team_basics")}
          rows={[
            { label: "Nome", value: data.name ?? "" },
            { label: "Tipo de campo", value: data.game_type ? GAME_TYPE_INFO[data.game_type].label : "" },
            { label: "Categoria", value: data.category ?? "" },
          ]}
        />

        <ReviewCard
          title="Localização"
          onEdit={() => onEdit("create_team_location")}
          rows={[{ label: "Endereço", value: data.address ?? "" }]}
        />

        <ReviewCard
          title="Horário dos jogos"
          onEdit={() => onEdit("create_team_schedule")}
          rows={[
            { label: "Dias", value: (data.usual_days ?? []).map(d => DAY_LABELS[d]).join(", ") },
            { label: "Horário", value: data.start_time && data.end_time ? `${data.start_time} - ${data.end_time}` : "" },
          ]}
        />

        <ReviewCard
          title="Avaliações"
          onEdit={() => onEdit("create_team_ratings")}
          rows={[
            { label: "Tempo para avaliar", value: data.rating_window_hours ? `${data.rating_window_hours} horas` : "" },
            { label: "Sistema", value: data.rating_scale ? `${data.rating_scale} estrelas` : "" },
          ]}
        />
      </div>

      <div className="flex gap-3 mt-8">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>← Voltar</Button>
        <Button className="flex-1 gap-2 font-semibold" onClick={onSubmit} disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando...</> : "🏆 Criar grupo"}
        </Button>
      </div>
    </div>
  );
}
