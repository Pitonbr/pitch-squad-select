// ============================================================
// src/components/TeamMatchmaking.tsx  — FASE 4
// Busca de times adversários para marcar partidas —
// diferencial competitivo único vs. Spond, TeamSnap etc.
//
// Permite:
//  - Buscar times públicos por nome ou localização
//  - Ver perfil resumido (nível, jogadores, último jogo)
//  - Enviar desafio (challenge request) via Supabase
// ============================================================

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useTeams } from "@/hooks/useTeams";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { Search, Swords, Users, MapPin, Trophy, Send, Star, CheckCircle2, XCircle, Clock, CreditCard } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { PaymentModal } from "@/components/payment/PaymentModal";

interface Team {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  player_count?: number;
  city?: string;
}

interface Challenge {
  id: string;
  challenger_team_id: string;
  challenged_team_id: string;
  status: string;
  challenger_paid_at: string | null;
  challenged_paid_at: string | null;
  game_id: string | null;
  challenger?: { name: string } | null;
  challenged?: { name: string } | null;
}

export function TeamMatchmaking() {
  const { activeTeam } = useTeams();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [challenged, setChallenged] = useState<Set<string>>(new Set());
  const debouncedQuery = useDebounce(query, 400);

  // ── Desafios do time ativo (recebidos/enviados) ──────────────
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [payModal, setPayModal] = useState<{
    open: boolean;
    challengeId: string;
    payerRole: "challenger" | "challenged";
    adversaryName?: string;
  }>({ open: false, challengeId: "", payerRole: "challenger" });

  const loadChallenges = useCallback(async () => {
    if (!activeTeam) return;
    setLoadingChallenges(true);
    try {
      const { data, error } = await supabase
        .from("team_challenges")
        .select("*, challenger:teams!team_challenges_challenger_team_id_fkey(name), challenged:teams!team_challenges_challenged_team_id_fkey(name)")
        .or(`challenger_team_id.eq.${activeTeam.id},challenged_team_id.eq.${activeTeam.id}`)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setChallenges((data as unknown as Challenge[]) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChallenges(false);
    }
  }, [activeTeam]);

  useEffect(() => { loadChallenges(); }, [loadChallenges]);

  const respondChallenge = async (challengeId: string, status: "accepted" | "rejected") => {
    try {
      const { error } = await supabase.from("team_challenges").update({ status }).eq("id", challengeId);
      if (error) throw error;
      toast({ title: status === "accepted" ? "Desafio aceito!" : "Desafio rejeitado" });
      loadChallenges();
    } catch {
      toast({ title: "Erro ao responder desafio", description: "Apenas o admin do time pode responder.", variant: "destructive" });
    }
  };

  const openPayment = (challenge: Challenge, payerRole: "challenger" | "challenged") => {
    const adversaryName = payerRole === "challenger" ? challenge.challenged?.name : challenge.challenger?.name;
    setPayModal({ open: true, challengeId: challenge.id, payerRole, adversaryName });
  };

  const searchTeams = useCallback(async (q: string) => {
    if (!activeTeam) return;
    setLoading(true);
    try {
      let qb = supabase
        .from("teams")
        .select("id, name, description, logo_url")
        .neq("id", activeTeam.id) // Exclui o time atual
        .limit(20);

      if (q.trim()) {
        qb = qb.ilike("name", `%${q.trim()}%`);
      }

      const { data, error } = await qb;
      if (error) throw error;
      setResults(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTeam]);

  useEffect(() => {
    searchTeams(debouncedQuery);
  }, [debouncedQuery, searchTeams]);

  const sendChallenge = async (targetTeam: Team) => {
    if (!activeTeam) return;
    try {
      // team_challenges armazena o desafio — game_id só é atribuído quando o jogo for criado
      const { error } = await supabase.from("team_challenges").insert({
        challenger_team_id: activeTeam.id,
        challenged_team_id: targetTeam.id,
        status: "pending",
      });

      if (error) throw error;

      setChallenged(prev => new Set(prev).add(targetTeam.id));
      toast({
        title: "Desafio enviado!",
        description: `${targetTeam.name} recebeu seu desafio. Aguarde a resposta!`,
      });
      loadChallenges();
    } catch {
      toast({
        title: "Erro ao enviar desafio",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          Buscar Times
        </h2>
        <p className="text-sm text-muted-foreground">
          Encontre times para marcar uma pelada ou campeonato
        </p>
      </div>

      {/* Campo de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome do time..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Resultados */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={Users}
          title={query ? "Nenhum time encontrado" : "Nenhum time disponível"}
          description={query ? `Não encontramos times com "${query}". Tente outro nome.` : "Quando outros times se cadastrarem, aparecerão aqui."}
        />
      ) : (
        <div className="space-y-3">
          {results.map(team => {
            const alreadyChallenged = challenged.has(team.id);
            return (
              <Card key={team.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 shrink-0 ring-1 ring-border">
                      <AvatarImage src={team.logo_url || undefined} alt={team.name} />
                      <AvatarFallback className="text-sm font-bold bg-primary/15 text-primary">
                        {team.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{team.name}</p>
                      {team.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{team.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {team.city && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3" />{team.city}
                          </span>
                        )}
                        {team.player_count !== undefined && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Users className="h-3 w-3" />{team.player_count} jogadores
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={alreadyChallenged ? "outline" : "default"}
                      disabled={alreadyChallenged}
                      onClick={() => sendChallenge(team)}
                      className="shrink-0 gap-1.5"
                    >
                      {alreadyChallenged ? (
                        <><Trophy className="h-3.5 w-3.5" />Enviado</>
                      ) : (
                        <><Send className="h-3.5 w-3.5" />Desafiar</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Meus Desafios */}
      {challenges.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Meus Desafios
          </h3>
          {challenges.map(challenge => {
            const isChallenger = activeTeam && challenge.challenger_team_id === activeTeam.id;
            const adversaryName = isChallenger ? challenge.challenged?.name : challenge.challenger?.name;
            const myPaidAt = isChallenger ? challenge.challenger_paid_at : challenge.challenged_paid_at;
            const adversaryPaidAt = isChallenger ? challenge.challenged_paid_at : challenge.challenger_paid_at;
            const canRespond = !isChallenger && challenge.status === "pending";
            const needsPayment = ["accepted", "challenger_paid", "challenged_paid"].includes(challenge.status) && !myPaidAt;

            let statusBadge: { label: string; icon: typeof Clock; className: string };
            switch (challenge.status) {
              case "pending":
                statusBadge = { label: "Aguardando resposta", icon: Clock, className: "bg-amber-500/15 text-amber-600 border-amber-500/30" };
                break;
              case "rejected":
                statusBadge = { label: "Rejeitado", icon: XCircle, className: "bg-destructive/15 text-destructive border-destructive/30" };
                break;
              case "cancelled":
                statusBadge = { label: "Cancelado", icon: XCircle, className: "bg-muted text-muted-foreground border-border" };
                break;
              case "confirmed":
                statusBadge = { label: "Jogo confirmado!", icon: CheckCircle2, className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" };
                break;
              default:
                statusBadge = { label: "Aguardando pagamento", icon: CreditCard, className: "bg-primary/15 text-primary border-primary/30" };
            }
            const StatusIcon = statusBadge.icon;

            return (
              <Card key={challenge.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">
                      {isChallenger ? "Você desafiou" : "Desafio de"} {adversaryName ?? "time"}
                    </p>
                    <Badge variant="outline" className={`gap-1 shrink-0 ${statusBadge.className}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusBadge.label}
                    </Badge>
                  </div>

                  {canRespond && (
                    <div className="flex gap-2">
                      <Button size="sm" className="gap-1.5" onClick={() => respondChallenge(challenge.id, "accepted")}>
                        <CheckCircle2 className="h-3.5 w-3.5" />Aceitar
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => respondChallenge(challenge.id, "rejected")}>
                        <XCircle className="h-3.5 w-3.5" />Rejeitar
                      </Button>
                    </div>
                  )}

                  {needsPayment && (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => openPayment(challenge, isChallenger ? "challenger" : "challenged")}
                    >
                      <CreditCard className="h-3.5 w-3.5" />Pagar R$10 (taxa de confirmação)
                    </Button>
                  )}

                  {myPaidAt && !adversaryPaidAt && challenge.status !== "confirmed" && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />Pagamento recebido — aguardando pagamento do adversário.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTeam && (
        <PaymentModal
          open={payModal.open}
          onClose={() => { setPayModal(p => ({ ...p, open: false })); loadChallenges(); }}
          type="matchup_fee"
          teamId={activeTeam.id}
          teamName={activeTeam.name}
          challengeId={payModal.challengeId}
          payerRole={payModal.payerRole}
          adversaryName={payModal.adversaryName}
        />
      )}
    </div>
  );
}
