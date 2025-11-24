import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AttendanceStats {
  total_games_invited: number;
  total_games_attended: number;
  attendance_percentage: number;
  last_30_days_invited: number;
  last_30_days_attended: number;
  last_30_days_percentage: number;
}

export function useAttendanceStats(playerId: string | undefined, teamId: string | undefined) {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (playerId && teamId) {
      fetchStats();
    }
  }, [playerId, teamId]);

  const fetchStats = async () => {
    if (!playerId || !teamId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_player_attendance_stats', {
          _player_id: playerId,
          _team_id: teamId
        });

      if (error) {
        console.error('Error fetching attendance stats:', error);
        return;
      }

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refresh: fetchStats };
}
