import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitialsAvatar } from "@/lib/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useTeams } from "@/hooks/useTeams";
import { TrendingUp, TrendingDown, Calendar, CheckCircle } from "lucide-react";

interface PlayerAttendance {
  player_id: string;
  player_name: string;
  player_position: string;
  total_games_invited: number;
  total_games_attended: number;
  attendance_percentage: number;
}

export function AttendanceStats() {
  const { activeTeam } = useTeams();
  const [stats, setStats] = useState<PlayerAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTeam) {
      fetchAttendanceStats();
    }
  }, [activeTeam]);

  const fetchAttendanceStats = async () => {
    if (!activeTeam) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_team_attendance_stats', { _team_id: activeTeam.id });

      if (error) {
        console.error('Error fetching attendance stats:', error);
        return;
      }

      setStats(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
  };

  const getAttendanceBadge = (percentage: number) => {
    if (percentage >= 80) return { variant: "default" as const, label: "Excelente", className: "bg-success" };
    if (percentage >= 60) return { variant: "secondary" as const, label: "Bom", className: "bg-warning" };
    return { variant: "destructive" as const, label: "Baixo", className: "" };
  };

  if (loading) {
    return (
      <Card variant="dark" className="backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-primary" />
            Estatísticas de Comparecimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (stats.length === 0) {
    return (
      <Card variant="dark" className="backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-primary" />
            Estatísticas de Comparecimento
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-white/50 mb-4" />
          <p className="text-white/70">
            Nenhum dado de comparecimento disponível ainda.
          </p>
          <p className="text-white/50 text-sm mt-2">
            As estatísticas serão calculadas após os primeiros jogos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const averageAttendance = stats.length > 0
    ? stats.reduce((sum, s) => sum + (s.attendance_percentage || 0), 0) / stats.length
    : 0;

  return (
    <Card variant="dark" className="backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-primary" />
            Estatísticas de Comparecimento
          </CardTitle>
          <Badge variant="outline" className="border-primary/50 text-white">
            Média do Time: {averageAttendance.toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((player) => {
          const badge = getAttendanceBadge(player.attendance_percentage || 0);
          const hasGames = player.total_games_invited > 0;

          return (
            <div
              key={player.player_id}
              className="flex items-center gap-4 p-3 rounded-lg bg-black/30 border border-primary/20 hover:border-primary/40 transition-colors"
            >
              <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                <AvatarImage src={getInitialsAvatar(player.player_name)} />
                <AvatarFallback className="bg-primary/20 text-white">
                  {player.player_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white text-sm truncate">
                      {player.player_name}
                    </h4>
                    <Badge variant="outline" className="text-xs border-primary/30 text-white/70">
                      {player.player_position}
                    </Badge>
                  </div>
                  {hasGames && (
                    <Badge className={badge.className} variant={badge.variant}>
                      {badge.label}
                    </Badge>
                  )}
                </div>

                {hasGames ? (
                  <>
                    <Progress 
                      value={player.attendance_percentage || 0} 
                      className="h-2 mb-2"
                    />
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4 text-white/70">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-success" />
                          {player.total_games_attended} presentes
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-primary" />
                          {player.total_games_invited} convidados
                        </span>
                      </div>
                      <span className={`font-bold ${getAttendanceColor(player.attendance_percentage || 0)}`}>
                        {player.attendance_percentage?.toFixed(1) || 0}%
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-white/50">
                    Nenhum jogo registrado ainda
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
