// ============================================================
// src/components/EmptyState.tsx  — FASE 3
// Componente de estado vazio reutilizável com CTA.
// Substitui os blocos inline "text-center py-8" espalhados.
// ============================================================

import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center gap-4 ${className}`}>
      {/* Ícone com fundo suave */}
      <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
        <Icon className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
      </div>

      {/* Texto */}
      <div className="space-y-1 max-w-xs">
        <p className="font-medium text-foreground/80">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>

      {/* Ações */}
      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-col sm:flex-row gap-2 mt-1">
          {actionLabel && onAction && (
            <Button size="sm" onClick={onAction} className="gap-2">
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && onSecondaryAction && (
            <Button size="sm" variant="outline" onClick={onSecondaryAction}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
