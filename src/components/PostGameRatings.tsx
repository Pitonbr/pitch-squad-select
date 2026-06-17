import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Star, Send, CheckCircle2, Users } from "lucide-react";

interface GameParticipant {
  player_id: string;
  player_name: string;
  nickname: string | null;
  player_position: string | null;
}

interface PostGameRatingsProps {
  gameId: string;
  gameTitle: string;
  onRatingsSubmitted?: () => void;
}

function RatingBar({
  playerId,
  playerName,
  nickname,
  playerPosition,
  value,
  onChange,
}: {
  playerId: string;
  playerName: string;
  nickname: string | null;
  playerPosition: string | null;
  value: number;
  onChange: (id: string, rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
        {(nickname || playerName).charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {nickname || playerName}
        </p>
        {playerPosition && (
          <p className="text-xs text-white/50 truncate">{playerPosition}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            onClick={() => onChange(playerId, n)}
            className={`w-6 h-6 rounded text-[11px] font-bold transition-all ${
              value === n
                ? "bg-primary text-white scale-110"
                : n <= value
                ? "bg-primary/30 text-primary"
                : "bg-white/10 text-white/40 hover:bg-white/20"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PostGameRatings({
  gameId,
  gameTitle,
  onRatingsSubmitted,
}: PostGameRatingsProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const { data: participants = [], isLoading } = useQuery<GameParticipant[]>({
    queryKey: ["game-participants-rating", gameId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_game_participants_for_rating",
        { p_game_id: gameId }
      );
      if (error) throw error;
      return (data ?? []) as GameParticipant[];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = Object.entries(ratings).map(([player_id, rating]) => ({
        player_id,
        rating,
      }));
      const { error } = await supabase.rpc("submit_game_ratings", {
        p_game_id: gameId,
        p_ratings: payload,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["game-highlights", gameId] });
      qc.invalidateQueries({ queryKey: ["has-rated", gameId] });
      qc.invalidateQueries({ queryKey: ["recent-games"] });
      toast({
        title: "Avaliações enviadas!",
        description: "Os destaques da partida já estão disponíveis.",
      });
      onRatingsSubmitted?.();
    },
    onError: (err: Error) => {
      toast({
        title: "Erro ao enviar avaliações",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleRatingChange = (playerId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [playerId]: rating }));
  };

  const ratedCount = Object.keys(ratings).length;
  const totalToRate = participants.length;
  const canSubmit = ratedCount === totalToRate && totalToRate > 0;

  if (isLoading) {
    return (
      <div className="text-center py-8 text-white/50 text-sm">
        Carregando jogadores...
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="text-center py-8 text-white/50 text-sm">
        Nenhum participante encontrado para avaliação.
      </div>
    );
  }

  return (
    <Card variant="dark" className="backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Star className="w-5 h-5 text-amber-400" />
          <div>
            <CardTitle className="text-white text-base">
              Avalie os jogadores
            </CardTitle>
            <p className="text-xs text-white/50 mt-0.5">{gameTitle}</p>
          </div>
          <Badge className="ml-auto bg-white/10 text-white/70 text-xs">
            {ratedCount}/{totalToRate} avaliados
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 pb-4">
        <p className="text-xs text-white/50 mb-4 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />
          Clique nos números 1–10 para dar sua nota a cada jogador
        </p>

        {participants.map((p) => (
          <RatingBar
            key={p.player_id}
            playerId={p.player_id}
            playerName={p.player_name}
            nickname={p.nickname}
            playerPosition={p.player_position}
            value={ratings[p.player_id] ?? 0}
            onChange={handleRatingChange}
          />
        ))}

        <div className="pt-4">
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!canSubmit || submitMutation.isPending}
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {submitMutation.isPending ? (
              "Enviando..."
            ) : canSubmit ? (
              <>
                <Send className="w-4 h-4" />
                Enviar Avaliações
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-white/40" />
                Avalie todos os {totalToRate} jogadores para enviar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
