// ============================================================
// src/components/onboarding/MatchResults.tsx
// Tela B.3.5 — Resultados da busca (até 3 times)
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Navigation, Star, Users, RotateCcw, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamSearchResult, GAME_TYPE_INFO, DAY_LABELS, DayOfWeek } from "@/types/onboarding";
import { TeamDetailSheet } from "./TeamDetailSheet";

interface MatchResultsProps {
  results: TeamSearchResult[];
  onRequest: (team: TeamSearchResult) => Promise<void>;
  onRetry: () => void;
  onGoHome: () => void;
}

export function MatchResults({ results, onRequest, onRetry, onGoHome }: MatchResultsProps) {
  const [selected, setSelected]   = useState<TeamSearchResult | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleRequestFromSheet = async () => {
    if (!selected) return;
    setRequesting(true);
    await onRequest(selected);
    setRequesting(false);
    setSheetOpen(false);
  };

  const handleDirectRequest = async (team: TeamSearchResult) => {
    setSelected(team);
    setRequesting(true);
    await onRequest(team);
    setRequesting(false);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">
          Encontramos <span className="text-primary">{results.length}</span> {results.length === 1 ? "jogo" : "jogos"} próximos a você
        </h2>
        <p className="text-sm text-muted-foreground">Escolha o que mais combina com você</p>
      </div>

      {results.map((team, idx) => {
        const gameInfo = team.game_type ? GAME_TYPE_INFO[team.game_type] : null;
        const initials = team.name.substring(0, 2).toUpperCase();
        const stars = Math.min(5, Math.round(team.compatibility_score ?? 0));

        return (
          <div
            key={team.id}
            className={cn(
              "bg-card border rounded-2xl p-4 space-y-3 transition-all hover:border-primary/40",
              idx === 0 ? "border-primary/30 ring-1 ring-primary/10" : "border-border"
            )}
          >
            {idx === 0 && (
              <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30 mb-1">
                ⭐ Melhor opção para você
              </Badge>
            )}

            {/* Header */}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-1 ring-border flex-shrink-0">
                <AvatarImage src={team.logo_url ?? undefined} />
                <AvatarFallback className="font-bold bg-primary/15 text-primary text-sm">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{team.name}</p>
                  {gameInfo && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {gameInfo.emoji} {gameInfo.label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Navigation className="h-3 w-3" />{team.distance_km} km
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Users className="h-3 w-3" />{team.player_count} jogadores
                  </span>
                  {/* Stars */}
                  <span className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={cn("h-3 w-3", i <= stars ? "fill-amber-400 text-amber-400" : "text-border")} />
                    ))}
                  </span>
                </div>
              </div>
            </div>

            {/* Days */}
            {team.usual_days && team.usual_days.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {(team.usual_days as DayOfWeek[]).map(d => (
                  <Badge key={d} variant="outline" className="text-[10px]">{DAY_LABELS[d] ?? d}</Badge>
                ))}
              </div>
            )}

            {/* Next game */}
            {team.next_game_date && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-1.5">
                <Calendar className="h-3 w-3 text-primary shrink-0" />
                <span>
                  Próximo jogo:{" "}
                  <strong className="text-foreground">
                    {new Date(team.next_game_date + "T00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    {team.next_game_time ? ` às ${team.next_game_time.slice(0, 5)}` : ""}
                  </strong>
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => { setSelected(team); setSheetOpen(true); }}
              >
                Ver detalhes
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleDirectRequest(team)}
                disabled={requesting && selected?.id === team.id}
              >
                {requesting && selected?.id === team.id ? "Enviando..." : "Solicitar entrada"}
              </Button>
            </div>
          </div>
        );
      })}

      {/* Footer actions */}
      <div className="flex flex-col gap-2 pt-2">
        <Button variant="outline" className="gap-2" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" /> Buscar novamente
        </Button>
        <button
          type="button"
          onClick={onGoHome}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors flex items-center justify-center gap-1.5"
        >
          <LayoutDashboard className="h-4 w-4" />
          Ir para o menu principal
        </button>
      </div>

      {/* Detail sheet */}
      <TeamDetailSheet
        team={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onRequest={handleRequestFromSheet}
        requesting={requesting}
      />
    </div>
  );
}
