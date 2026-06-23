import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star } from "lucide-react";

interface LineupOfRoundEntry {
  player_position: string;
  player_id: string;
  player_name: string;
  player_nickname: string;
  avg_rating: number;
}

interface HighlightEntry {
  player_id: string | null;
  player_name: string | null;
  value: number | null;
}

interface Highlights {
  craque: HighlightEntry | null;
  pereba: HighlightEntry | null;
  artilheiro: HighlightEntry | null;
  garcom: HighlightEntry | null;
  xerifao: HighlightEntry | null;
  paredao: HighlightEntry | null;
  bola_murcha: HighlightEntry | null;
}

const HIGHLIGHT_CONFIG: {
  key: keyof Highlights;
  emoji: string;
  label: string;
  description: (v: number) => string;
  cardClass: string;
  labelClass: string;
}[] = [
  {
    key: "craque",
    emoji: "👑",
    label: "Craque",
    description: (v) => `Nota ${v}`,
    cardClass: "bg-amber-500/10 border-amber-500/30",
    labelClass: "text-amber-400",
  },
  {
    key: "artilheiro",
    emoji: "⚽",
    label: "Artilheiro",
    description: (v) => `${v} gol${v !== 1 ? "s" : ""}`,
    cardClass: "bg-emerald-500/10 border-emerald-500/30",
    labelClass: "text-emerald-400",
  },
  {
    key: "garcom",
    emoji: "🎯",
    label: "Garçom",
    description: (v) => `${v} assist${v !== 1 ? "ências" : "ência"}`,
    cardClass: "bg-sky-500/10 border-sky-500/30",
    labelClass: "text-sky-400",
  },
  {
    key: "xerifao",
    emoji: "💪",
    label: "Xerifão",
    description: (v) => `${v} desarme${v !== 1 ? "s" : ""}`,
    cardClass: "bg-violet-500/10 border-violet-500/30",
    labelClass: "text-violet-400",
  },
  {
    key: "paredao",
    emoji: "🧤",
    label: "Paredão",
    description: (v) => `${v} defesa${v !== 1 ? "s" : ""}`,
    cardClass: "bg-cyan-500/10 border-cyan-500/30",
    labelClass: "text-cyan-400",
  },
  {
    key: "bola_murcha",
    emoji: "🎈",
    label: "Bola Murcha",
    description: (v) => `${v} falta${v !== 1 ? "s" : ""}`,
    cardClass: "bg-orange-500/10 border-orange-500/30",
    labelClass: "text-orange-400",
  },
  {
    key: "pereba",
    emoji: "💩",
    label: "Pereba",
    description: (v) => `Nota ${v}`,
    cardClass: "bg-red-500/10 border-red-500/30",
    labelClass: "text-red-400",
  },
];

interface GameHighlightsProps {
  gameId: string;
  gameTitle: string;
}

export function GameHighlights({ gameId, gameTitle }: GameHighlightsProps) {
  const { data: highlights, isLoading } = useQuery<Highlights>({
    queryKey: ["game-highlights", gameId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_game_highlights", {
        p_game_id: gameId,
      });
      if (error) throw error;
      return data as Highlights;
    },
  });

  const { data: lineupOfRound } = useQuery<LineupOfRoundEntry[]>({
    queryKey: ["game-lineup-of-round", gameId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_game_lineup_of_the_round", {
        p_game_id: gameId,
      });
      if (error) throw error;
      return (data as LineupOfRoundEntry[]) || [];
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-white/50 text-sm">
        Calculando destaques...
      </div>
    );
  }

  if (!highlights) return null;

  const hasAnyHighlight = HIGHLIGHT_CONFIG.some(
    (cfg) => highlights[cfg.key]?.player_name
  );

  if (!hasAnyHighlight) {
    return (
      <Card variant="dark" className="backdrop-blur-md">
        <CardContent className="py-8 text-center text-white/50 text-sm">
          Destaques serão exibidos após os jogadores avaliarem uns aos outros.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card variant="dark" className="backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <CardTitle className="text-white text-base">
                Destaques da Partida
              </CardTitle>
              <p className="text-xs text-white/50 mt-0.5">{gameTitle}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {HIGHLIGHT_CONFIG.map((cfg) => {
              const entry = highlights[cfg.key];
              if (!entry?.player_name) return null;
              return (
                <div
                  key={cfg.key}
                  className={`rounded-xl border p-3 flex flex-col items-center text-center gap-1 ${cfg.cardClass}`}
                >
                  <span className="text-2xl">{cfg.emoji}</span>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${cfg.labelClass}`}>
                    {cfg.label}
                  </p>
                  <p className="text-sm font-bold text-white leading-tight">
                    {entry.player_name}
                  </p>
                  {entry.value !== null && (
                    <p className="text-xs text-white/50">
                      {cfg.description(entry.value)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {lineupOfRound && lineupOfRound.length > 0 && (
        <Card variant="dark" className="backdrop-blur-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-400" />
              <CardTitle className="text-white text-base">Seleção da Rodada</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {lineupOfRound.map((entry) => (
                <div
                  key={entry.player_position}
                  className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 flex flex-col items-center text-center gap-1"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400">
                    {entry.player_position}
                  </p>
                  <p className="text-sm font-bold text-white leading-tight">
                    {entry.player_nickname || entry.player_name}
                  </p>
                  <p className="text-xs text-white/50">Nota {entry.avg_rating}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
