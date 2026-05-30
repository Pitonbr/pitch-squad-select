import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitialsAvatar } from "@/lib/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, Loader2, CheckCircle2, Users } from "lucide-react";
import { JoinRequestStatus } from "@/components/JoinRequestStatus";

interface Game {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  status: string;
  team_id: string;
}

interface CheckedInPlayer {
  id: string;
  name: string;
  profile_image?: string;
}

export default function GameCheckInPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { activeTeam } = useTeams();
  const { toast } = useToast();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedInPlayers, setCheckedInPlayers] = useState<CheckedInPlayer[]>([]);
  const [isTeamMember, setIsTeamMember] = useState<boolean | null>(null);
  const [joinRequestStatus, setJoinRequestStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/game-checkin/${gameId}`);
      return;
    }

    if (user && gameId) {
      fetchGameAndCheckInStatus();
    }
  }, [gameId, user, authLoading, navigate]);

  const fetchGameAndCheckInStatus = async () => {
    if (!gameId || !profile) return;

    try {
      // Fetch game details
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (gameError || !gameData) {
        toast({
          title: "Erro",
          description: "Jogo não encontrado",
          variant: "destructive"
        });
        navigate("/");
        return;
      }

      setGame(gameData as Game);

      // Check if user is team member
      const { data: memberData } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", gameData.team_id)
        .eq("profile_id", profile.id)
        .maybeSingle();

      const isMember = !!memberData;
      setIsTeamMember(isMember);

      // Check if user already checked in
      const { data: participantData } = await supabase
        .from("game_participants")
        .select("*, players(id, name, profile_image)")
        .eq("game_id", gameId)
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (participantData && participantData.status === "confirmed") {
        setCheckedIn(true);
      }

      // Fetch all checked-in players
      const { data: allParticipants } = await supabase
        .from("game_participants")
        .select("players(id, name, profile_image)")
        .eq("game_id", gameId)
        .eq("status", "confirmed");

      if (allParticipants) {
        const players: CheckedInPlayer[] = [];
        for (const participant of allParticipants) {
          if (participant.players) {
            const p = participant.players as any;
            players.push({
              id: p.id,
              name: p.name,
              profile_image: p.profile_image
            });
          }
        }
        setCheckedInPlayers(players);
      }
    } catch (err) {
      console.error("Error fetching game:", err);
      toast({
        title: "Erro",
        description: "Erro ao carregar informações do jogo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!game || !profile || !user) return;

    setCheckingIn(true);

    try {
      // If not a team member, create join request
      if (!isTeamMember) {
        const { data, error } = await supabase.rpc('create_game_join_request', {
          _team_id: game.team_id,
          _game_id: game.id,
          _message: `Solicitação via convite para o jogo: ${game.title}`
        });

        if (error) throw error;

        const result = data?.[0];
        if (result?.success) {
          toast({
            title: "Solicitação Enviada",
            description: result.message,
          });
          setJoinRequestStatus('pending');
          return;
        } else {
          throw new Error(result?.message || "Erro ao criar solicitação");
        }
      }

      // If team member, proceed with check-in
      let playerId: string | null = null;
      
      const { data: existingPlayer } = await supabase
        .from("players")
        .select("id")
        .eq("team_id", game.team_id)
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (existingPlayer) {
        playerId = existingPlayer.id;
      } else {
        throw new Error("Erro: jogador não encontrado no time");
      }

      if (!playerId) {
        throw new Error("Não foi possível encontrar jogador");
      }

      // Add or update game participant
      const { error: participantError } = await supabase
        .from("game_participants")
        .upsert({
          game_id: game.id,
          player_id: playerId,
          profile_id: profile.id,
          status: "confirmed",
          checked_in_at: new Date().toISOString(),
        }, {
          onConflict: "game_id,player_id"
        });

      if (participantError) {
        throw participantError;
      }

      setCheckedIn(true);
      toast({
        title: "✅ Check-in confirmado!",
        description: "Sua presença foi registrada para o jogo.",
      });

      // Refresh checked-in players list
      fetchGameAndCheckInStatus();
    } catch (err: any) {
      console.error("Error checking in:", err);
      toast({
        title: "Erro no check-in",
        description: err.message || "Não foi possível confirmar sua presença",
        variant: "destructive"
      });
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen stadium-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen stadium-bg flex items-center justify-center">
        <Card variant="dark" className="w-full max-w-md backdrop-blur-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Jogo não encontrado</h2>
            <Button onClick={() => navigate("/")} className="mt-4">
              Voltar para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gameDate = new Date(`${game.date}T${game.time}`);
  const formattedDate = gameDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen stadium-bg">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card variant="dark" className="backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white text-center text-2xl">
              {checkedIn ? "✅ Check-in Confirmado!" : "Confirme sua Presença"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-6 rounded-lg border border-primary/30">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                ⚽ {game.title}
              </h2>
              
              <div className="space-y-3 text-white/90">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="capitalize">{formattedDate}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>{game.time}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>{game.location}</span>
                </div>
              </div>

              {game.description && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-white/80">{game.description}</p>
                </div>
              )}
            </div>

            {/* Show join request status if user is not a team member */}
            {!isTeamMember && joinRequestStatus && (
              <JoinRequestStatus 
                gameId={game.id}
                teamId={game.team_id}
                onStatusChange={(status) => {
                  setJoinRequestStatus(status);
                  if (status === 'approved') {
                    // Reload to update team membership
                    fetchGameAndCheckInStatus();
                  }
                }}
              />
            )}

            {!checkedIn && isTeamMember && !joinRequestStatus ? (
              <Button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full bg-primary hover:bg-accent text-white font-bold h-14 text-lg"
              >
                {checkingIn ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Confirmar Participação
                  </>
                )}
              </Button>
            ) : !checkedIn && !isTeamMember && !joinRequestStatus ? (
              <Button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full bg-primary hover:bg-accent text-white font-bold h-14 text-lg"
              >
                {checkingIn ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando Solicitação...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Solicitar Entrada no Time
                  </>
                )}
              </Button>
            ) : (
              <div className="bg-accent/20 border-2 border-accent rounded-lg p-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-accent mx-auto mb-3" />
                <p className="text-white font-bold text-lg mb-2">
                  Presença Confirmada!
                </p>
                <p className="text-white/70 text-sm">
                  Você está inscrito para este jogo. Nos vemos no campo! ⚽
                </p>
              </div>
            )}

            {checkedInPlayers.length > 0 && (
              <div className="bg-black/30 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="text-white font-semibold">
                    Jogadores Confirmados ({checkedInPlayers.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {checkedInPlayers.map((player) => (
                    <div key={player.id} className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={player.profile_image || getInitialsAvatar(player.name)} />
                        <AvatarFallback className="text-xs">{player.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-white text-sm">{player.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="bg-black/30 border-primary/30 text-white hover:bg-black/50"
              >
                Voltar para Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
