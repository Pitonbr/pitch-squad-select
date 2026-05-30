// ============================================================
// src/components/onboarding/InviteWelcome.tsx
// Tela A.1 — Boas-vindas para jogador com convite
// ============================================================

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, MapPin, Trophy, AlertCircle } from "lucide-react";
import { InviteTeamInfo } from "@/types/onboarding";

interface InviteWelcomeProps {
  teamInfo: InviteTeamInfo | null;
  loading: boolean;
  error: string | null;
  onAccept: () => void;
  onDecline: () => void;
}

export function InviteWelcome({ teamInfo, loading, error, onAccept, onDecline }: InviteWelcomeProps) {
  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <Skeleton className="h-24 w-24 rounded-full mx-auto" />
        <Skeleton className="h-7 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !teamInfo) {
    return (
      <div className="w-full max-w-md mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Convite inválido</h2>
        <p className="text-sm text-muted-foreground">
          {error ?? "Este convite não existe ou já expirou."}
        </p>
        <Button variant="outline" className="w-full" onClick={onDecline}>
          Cadastrar sem convite
        </Button>
      </div>
    );
  }

  const initials = teamInfo.name.substring(0, 2).toUpperCase();

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-6">
      {/* Team logo */}
      <div className="flex flex-col items-center gap-3">
        <Avatar className="h-24 w-24 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
          <AvatarImage src={teamInfo.logo_url} alt={teamInfo.name} />
          <AvatarFallback className="text-2xl font-bold bg-primary/15 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <Badge variant="outline" className="text-xs mb-2">Convite recebido</Badge>
          <h1 className="text-2xl font-bold">{teamInfo.name}</h1>
          {teamInfo.admin_name && (
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{teamInfo.admin_name}</span> te convidou para este time
            </p>
          )}
          {teamInfo.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
              {teamInfo.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs">Jogadores</span>
          </div>
          <p className="text-2xl font-bold text-primary">{teamInfo.player_count ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">no elenco</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">Próximo jogo</span>
          </div>
          {teamInfo.next_game ? (
            <>
              <p className="text-sm font-bold text-foreground">
                {new Date(teamInfo.next_game.split(" ")[0] + "T00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {teamInfo.next_game.split(" ")[1]?.slice(0, 5)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sem jogo agendado</p>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-3">
        <Button className="w-full gap-2 h-12 text-base font-semibold" onClick={onAccept}>
          <Trophy className="h-5 w-5" />
          Aceitar convite e criar minha conta
        </Button>
        <button
          type="button"
          onClick={onDecline}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Já tenho conta — fazer login
        </button>
      </div>
    </div>
  );
}
