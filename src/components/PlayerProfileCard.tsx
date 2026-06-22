import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Target, Goal, Trophy, CalendarDays, ScrollText, Gavel } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { useToast } from "@/hooks/use-toast";
import { getInitialsAvatar } from "@/lib/avatar";

interface PlayerProfileCardProps {
  playerId: string;
  name: string;
  nickname: string;
  profileImage?: string;
  trigger?: React.ReactNode;
}

interface CareerStats {
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  tackles: number;
  games_played: number;
  avg_rating: number | null;
  total_votes: number;
}

interface MatchRecord {
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  win_rate: number | null;
}

const STAT_FIELD_LABELS: Record<string, string> = {
  goals: "Gols",
  assists: "Assistências",
  yellow_cards: "Cartões Amarelos",
  red_cards: "Cartões Vermelhos",
  saves: "Defesas",
  tackles: "Desarmes",
  fouls: "Faltas",
};

export function PlayerProfileCard({ playerId, name, nickname, profileImage, trigger }: PlayerProfileCardProps) {
  const { profile } = useAuth();
  const { activeTeam } = useTeams();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [careerStats, setCareerStats] = useState<CareerStats | null>(null);
  const [matchRecord, setMatchRecord] = useState<MatchRecord | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeField, setDisputeField] = useState("");
  const [disputeValue, setDisputeValue] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const fetchProfileData = async () => {
    if (!activeTeam?.id) return;
    setLoading(true);
    try {
      const { data: playerRow } = await supabase
        .from("players")
        .select("profile_id")
        .eq("id", playerId)
        .single();

      setIsOwnProfile(!!profile?.id && playerRow?.profile_id === profile.id);

      if (playerRow?.profile_id) {
        const { data: membership } = await supabase
          .from("team_members")
          .select("joined_at")
          .eq("team_id", activeTeam.id)
          .eq("profile_id", playerRow.profile_id)
          .single();
        setMemberSince(membership?.joined_at || null);
      }

      const [{ data: careerData }, { data: recordData }] = await Promise.all([
        supabase.rpc("get_player_career_stats", { p_player_id: playerId }),
        supabase.rpc("get_player_match_record", { p_player_id: playerId }),
      ]);

      setCareerStats(careerData as unknown as CareerStats);
      setMatchRecord(recordData as unknown as MatchRecord);
    } catch (error) {
      console.error("Error fetching player profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchProfileData();
  }, [open, playerId, activeTeam?.id]);

  const handleSubmitDispute = async () => {
    if (!disputeField || disputeValue === "") return;
    setSubmittingDispute(true);
    try {
      const { error } = await supabase.rpc("submit_stat_dispute", {
        p_player_id: playerId,
        p_stat_field: disputeField,
        p_requested_value: parseInt(disputeValue, 10),
        p_reason: disputeReason || null,
      });
      if (error) throw error;
      toast({ title: "Contestação enviada", description: "O administrador vai revisar seu pedido." });
      setDisputeOpen(false);
      setDisputeField("");
      setDisputeValue("");
      setDisputeReason("");
    } catch (error: any) {
      toast({ title: "Erro ao enviar contestação", description: error.message, variant: "destructive" });
    } finally {
      setSubmittingDispute(false);
    }
  };

  const memberSinceLabel = memberSince
    ? new Date(memberSince).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-xs h-7 border-primary/50 text-white hover:bg-primary/20">
            <ScrollText className="h-3 w-3 mr-1" />
            Ver perfil
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Perfil do Jogador</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center gap-2">
              <Avatar className="h-20 w-20 ring-2 ring-primary/40">
                <AvatarImage src={profileImage || getInitialsAvatar(name)} alt={name} />
                <AvatarFallback className="text-lg font-semibold">
                  {name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{name}</h3>
                <p className="text-sm text-muted-foreground">"{nickname}"</p>
              </div>
              {memberSinceLabel && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Membro desde {memberSinceLabel}
                </p>
              )}
              {careerStats?.avg_rating != null && (
                <Badge className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/40 gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {careerStats.avg_rating.toFixed(1)} ({careerStats.total_votes} votos)
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <Goal className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <div className="text-xl font-bold">{careerStats?.goals ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Gols</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <Target className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <div className="text-xl font-bold">{careerStats?.assists ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Assistências</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <Trophy className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <div className="text-xl font-bold">{matchRecord?.wins ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Vitórias</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <CalendarDays className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <div className="text-xl font-bold">{matchRecord?.games_played ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Jogos</div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              {matchRecord?.win_rate != null ? (
                <Badge variant="secondary" className="text-sm">
                  Taxa de vitória: {matchRecord.win_rate}%
                </Badge>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Taxa de vitória disponível após jogos com time definido
                </p>
              )}
            </div>

            {isOwnProfile && (
              <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Gavel className="h-4 w-4" />
                    Contestar estatística
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Contestar estatística</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Estatística</Label>
                      <Select value={disputeField} onValueChange={setDisputeField}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a estatística" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STAT_FIELD_LABELS).map(([field, label]) => (
                            <SelectItem key={field} value={field}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Valor correto</Label>
                      <Input
                        type="number"
                        min="0"
                        value={disputeValue}
                        onChange={(e) => setDisputeValue(e.target.value)}
                        placeholder="Ex: 3"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Motivo (opcional)</Label>
                      <Textarea
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="Explique por que essa estatística está incorreta"
                      />
                    </div>
                    <Button
                      className="w-full"
                      disabled={!disputeField || disputeValue === "" || submittingDispute}
                      onClick={handleSubmitDispute}
                    >
                      Enviar contestação
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
