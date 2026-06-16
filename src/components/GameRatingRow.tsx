import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostGameRatings } from "./PostGameRatings";
import { GameHighlights } from "./GameHighlights";
import { Star, Trophy, ChevronDown, ChevronUp } from "lucide-react";

interface Game {
  id: string;
  title: string;
  date: string;
  location: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
}

interface GameRatingRowProps {
  game: Game;
  resultIcon?: React.ReactNode;
}

export function GameRatingRow({ game, resultIcon }: GameRatingRowProps) {
  const qc = useQueryClient();
  const [panel, setPanel] = useState<"rating" | "highlights" | null>(null);

  // Check if user has already rated this game
  const { data: hasRated, isLoading: checkingRated } = useQuery<boolean>({
    queryKey: ["has-rated", game.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_user_rated_game", {
        p_game_id: game.id,
      });
      if (error) return false;
      return Boolean(data);
    },
    enabled: game.status === "finished",
  });

  const handleRatingsSubmitted = () => {
    qc.invalidateQueries({ queryKey: ["has-rated", game.id] });
    setPanel("highlights");
  };

  const isFinished = game.status === "finished";

  return (
    <div className="rounded-lg bg-muted/50 overflow-hidden">
      {/* Main row */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3 min-w-0">
          {resultIcon}
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{game.title}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(game.date).toLocaleDateString("pt-BR")} •{" "}
              {game.location}
            </p>
            {isFinished &&
              game.home_score !== null &&
              game.away_score !== null && (
                <p className="text-xs text-accent font-bold mt-0.5">
                  {game.home_score} x {game.away_score}
                </p>
              )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isFinished ? (
            <>
              {!checkingRated && (
                <>
                  {!hasRated ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 gap-1 text-xs border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                      onClick={() =>
                        setPanel(panel === "rating" ? null : "rating")
                      }
                    >
                      <Star className="w-3 h-3" />
                      {panel === "rating" ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        "Avaliar"
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 gap-1 text-xs border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() =>
                        setPanel(panel === "highlights" ? null : "highlights")
                      }
                    >
                      <Trophy className="w-3 h-3" />
                      {panel === "highlights" ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        "Destaques"
                      )}
                    </Button>
                  )}
                </>
              )}
              <Badge
                variant="outline"
                className="border-success/50 text-success hidden sm:inline-flex"
              >
                Finalizado
              </Badge>
            </>
          ) : (
            <Badge variant="outline" className="border-gray-500 text-gray-400">
              Não Realizado
            </Badge>
          )}
        </div>
      </div>

      {/* Expandable panels */}
      {panel === "rating" && (
        <div className="border-t border-white/10 p-3">
          <PostGameRatings
            gameId={game.id}
            gameTitle={game.title}
            onRatingsSubmitted={handleRatingsSubmitted}
          />
        </div>
      )}

      {panel === "highlights" && (
        <div className="border-t border-white/10 p-3">
          <GameHighlights gameId={game.id} gameTitle={game.title} />
        </div>
      )}
    </div>
  );
}
