import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AttendanceRow {
  game_id: string;
  game_date: string;
  game_title: string;
  present: boolean;
}

interface MonthGroup {
  key: string;
  label: string;
  games: AttendanceRow[];
}

export function PlayerAttendanceHistory({ playerId }: { playerId: string }) {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data } = await supabase.rpc("get_player_attendance_history", { p_player_id: playerId });
      setRows((data as unknown as AttendanceRow[]) || []);
      setLoading(false);
    };
    fetchHistory();
  }, [playerId]);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando histórico...</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sem jogos finalizados no histórico ainda.</p>;

  const totalGames = rows.length;
  const presences = rows.filter((r) => r.present).length;
  const absences = totalGames - presences;
  const rate = totalGames > 0 ? Math.round((presences / totalGames) * 100) : 0;

  const groups: MonthGroup[] = [];
  for (const row of rows) {
    const date = new Date(`${row.game_date}T00:00:00`);
    const key = format(date, "yyyy-MM");
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: format(date, "MMMM 'de' yyyy", { locale: ptBR }), games: [] };
      groups.push(group);
    }
    group.games.push(row);
  }
  groups.sort((a, b) => b.key.localeCompare(a.key));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-around text-center">
        <div>
          <div className="text-lg font-bold">{totalGames}</div>
          <div className="text-xs text-muted-foreground">Jogos</div>
        </div>
        <div>
          <div className="text-lg font-bold text-emerald-500">{presences}</div>
          <div className="text-xs text-muted-foreground">Presenças</div>
        </div>
        <div>
          <div className="text-lg font-bold text-red-500">{absences}</div>
          <div className="text-xs text-muted-foreground">Ausências</div>
        </div>
        <div>
          <Badge variant="secondary">{rate}%</Badge>
          <div className="text-xs text-muted-foreground mt-0.5">Taxa</div>
        </div>
      </div>

      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.key}>
            <p className="text-xs font-medium text-muted-foreground capitalize mb-1">{group.label}</p>
            <div className="flex flex-wrap gap-1">
              {group.games.map((g) => (
                <div
                  key={g.game_id}
                  title={`${g.game_title} — ${format(new Date(`${g.game_date}T00:00:00`), "dd/MM/yyyy")} — ${g.present ? "Presente" : "Ausente"}`}
                  className={`h-4 w-4 rounded-sm ${g.present ? "bg-emerald-500" : "bg-red-500"}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
