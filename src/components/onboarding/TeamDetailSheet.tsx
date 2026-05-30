// ============================================================
// src/components/onboarding/TeamDetailSheet.tsx
// Bottom sheet com detalhes do time selecionado
// ============================================================

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Users, Clock, Star, Navigation } from "lucide-react";
import { TeamSearchResult, GAME_TYPE_INFO, DAY_LABELS, DayOfWeek } from "@/types/onboarding";
import { cn } from "@/lib/utils";

interface TeamDetailSheetProps {
  team: TeamSearchResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequest: () => void;
  requesting: boolean;
}

export function TeamDetailSheet({ team, open, onOpenChange, onRequest, requesting }: TeamDetailSheetProps) {
  if (!team) return null;

  const gameInfo = team.game_type ? GAME_TYPE_INFO[team.game_type] : null;
  const initials = team.name.substring(0, 2).toUpperCase();
  const stars = Math.min(5, Math.round((team.compatibility_score ?? 0)));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto pb-safe">
        <div className="w-12 h-1.5 rounded-full bg-border mx-auto mb-6" />

        <SheetHeader className="mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-border flex-shrink-0">
              <AvatarImage src={team.logo_url ?? undefined} />
              <AvatarFallback className="text-lg font-bold bg-primary/15 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <SheetTitle className="text-xl text-left">{team.name}</SheetTitle>
              {team.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{team.description}</p>
              )}
              {/* Stars */}
              <div className="flex items-center gap-0.5 mt-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={cn("h-3.5 w-3.5", i <= stars ? "fill-amber-400 text-amber-400" : "text-border")} />
                ))}
                <span className="text-[11px] text-muted-foreground ml-1">Compatibilidade</span>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{team.player_count ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">jogadores</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <Navigation className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{team.distance_km ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">km de você</p>
          </div>
          <div className={cn("border rounded-xl p-3 text-center",
            gameInfo ? "bg-primary/5 border-primary/20" : "bg-card border-border")}>
            <span className="text-xl block mb-0.5">{gameInfo?.emoji ?? "⚽"}</span>
            <p className="text-[10px] text-muted-foreground">{gameInfo?.label ?? "Futebol"}</p>
          </div>
        </div>

        <Separator className="mb-5" />

        {/* Info rows */}
        <div className="space-y-3 mb-6">
          {(team.city || team.neighborhood) && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm">{[team.neighborhood, team.city, team.state].filter(Boolean).join(", ")}</p>
            </div>
          )}
          {team.usual_days && team.usual_days.length > 0 && (
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1.5">
                {(team.usual_days as DayOfWeek[]).map(d => (
                  <Badge key={d} variant="outline" className="text-xs">{DAY_LABELS[d] ?? d}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Next game */}
        {team.next_game_date && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-2">⚡ Próxima partida</p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {new Date(team.next_game_date + "T00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
              </div>
              {team.next_game_time && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {team.next_game_time.slice(0, 5)}
                </div>
              )}
              {team.next_game_location && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[160px]">{team.next_game_location}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={onRequest}
          disabled={requesting}
        >
          {requesting ? "Enviando solicitação..." : "Solicitar participação"}
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-3">
          O administrador do time receberá sua solicitação e irá aprovar sua entrada
        </p>
      </SheetContent>
    </Sheet>
  );
}
