import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import { Users, Crown, Plus } from "lucide-react";
interface TeamSelectorProps {
  onCreateTeam?: () => void;
}
export function TeamSelector({
  onCreateTeam
}: TeamSelectorProps) {
  const {
    userTeams,
    activeTeam,
    setActiveTeam,
    isTeamAdmin
  } = useTeams();
  const {
    profile
  } = useAuth();
  if (!profile) return null;
  return <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        
      </div>

      {userTeams.length > 0 ? <div className="flex items-center space-x-2">
          <Select value={activeTeam?.id || ""} onValueChange={value => {
        const team = userTeams.find(t => t.id === value);
        setActiveTeam(team || null);
      }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione um time" />
            </SelectTrigger>
            <SelectContent>
              {userTeams.map(team => <SelectItem key={team.id} value={team.id}>
                  <div className="flex items-center space-x-2">
                    <span>{team.name}</span>
                    {isTeamAdmin(team.id) && <Crown className="h-3 w-3 text-amber-500" />}
                  </div>
                </SelectItem>)}
            </SelectContent>
          </Select>

          {activeTeam && isTeamAdmin(activeTeam.id) && <Badge variant="secondary" className="text-xs">
              <Crown className="h-3 w-3 mr-1" />
              Admin
            </Badge>}
        </div> : <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Nenhum time encontrado</span>
        </div>}

      {onCreateTeam && <Button variant="outline" size="sm" onClick={onCreateTeam} className="flex items-center space-x-1">
          <Plus className="h-3 w-3" />
          <span>Criar Time</span>
        </Button>}
    </div>;
}