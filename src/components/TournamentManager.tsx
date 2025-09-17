import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Trophy, 
  Users, 
  Plus,
  Trash2,
  Calendar,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useTeams";
import { useTournaments, Tournament } from "@/hooks/useTournaments";
import { PlayerSelector } from "./PlayerSelector";
import { TournamentBracket } from "./TournamentBracket";
import { TournamentMatchDialog } from "./TournamentMatchDialog";
import { supabase } from "@/integrations/supabase/client";

interface Player {
  id: string;
  name: string;
  nickname: string;
  position: string;
  phone: string;
}

interface TeamList {
  id: string;
  name: string;
  playerIds: string[];
  createdAt: Date;
}

export function TournamentManager() {
  const { user } = useAuth();
  const { activeTeam, isTeamAdmin } = useTeams();
  const { tournaments, loading, createTournament, deleteTournament } = useTournaments();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  
  // Create tournament form state
  const [tournamentName, setTournamentName] = useState("");
  const [tournamentDescription, setTournamentDescription] = useState("");
  const [tournamentType, setTournamentType] = useState<'single_elimination' | 'round_robin'>('single_elimination');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [teamLists, setTeamLists] = useState<TeamList[]>([]);

  useEffect(() => {
    if (activeTeam?.id) {
      fetchTeamPlayers();
    }
  }, [activeTeam?.id]);

  const fetchTeamPlayers = async () => {
    if (!activeTeam?.id) return;

    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', activeTeam.id);

      if (error) throw error;
      setTeamPlayers(data || []);
    } catch (error) {
      console.error('Error fetching team players:', error);
    }
  };

  const handleCreateTournament = async () => {
    if (!tournamentName.trim() || selectedPlayerIds.length < 4) {
      return;
    }

    const tournament = await createTournament({
      name: tournamentName.trim(),
      description: tournamentDescription.trim(),
      tournament_type: tournamentType,
      player_ids: selectedPlayerIds
    });

    if (tournament) {
      // Reset form
      setTournamentName("");
      setTournamentDescription("");
      setSelectedPlayerIds([]);
      setShowCreateForm(false);
    }
  };

  const handleTeamListSave = (teamList: Omit<TeamList, 'id' | 'createdAt'>) => {
    const newTeamList: TeamList = {
      id: Date.now().toString(),
      ...teamList,
      createdAt: new Date()
    };
    setTeamLists([...teamLists, newTeamList]);
  };

  const handleTeamListDelete = (teamListId: string) => {
    setTeamLists(teamLists.filter(tl => tl.id !== teamListId));
  };

  const handleTeamListLoad = (playerIds: string[]) => {
    setSelectedPlayerIds(playerIds);
  };

  const handleMatchClick = (match: any) => {
    setSelectedMatch(match);
    setShowMatchDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Campeonatos</h2>
          <p className="text-muted-foreground">Crie e gerencie torneios do seu time</p>
        </div>
        {isTeamAdmin(activeTeam?.id) && (
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="field-gradient text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Campeonato
          </Button>
        )}
      </div>

      {/* Tournament Detail View */}
      {selectedTournament && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedTournament(null)}
            >
              ← Voltar
            </Button>
            <div>
              <h3 className="text-xl font-bold">{selectedTournament.name}</h3>
              <p className="text-muted-foreground">{selectedTournament.description}</p>
            </div>
          </div>

          <TournamentBracket
            tournamentId={selectedTournament.id}
            tournamentType={selectedTournament.tournament_type}
            isAdmin={isTeamAdmin(activeTeam?.id)}
            onMatchClick={handleMatchClick}
          />
        </div>
      )}

      {/* Create Tournament Form */}
      {showCreateForm && !selectedTournament && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Campeonato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tournament-name">Nome do Campeonato</Label>
                <Input
                  id="tournament-name"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  placeholder="Ex: Copa Primavera 2024"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tournament-type">Tipo de Campeonato</Label>
                <Select value={tournamentType} onValueChange={(value: 'single_elimination' | 'round_robin') => setTournamentType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_elimination">Eliminatórias Simples</SelectItem>
                    <SelectItem value="round_robin">Ida e Volta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tournament-description">Descrição</Label>
              <Textarea
                id="tournament-description"
                value={tournamentDescription}
                onChange={(e) => setTournamentDescription(e.target.value)}
                placeholder="Descrição opcional do campeonato..."
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Selecionar Jogadores do Time</h4>
              <PlayerSelector
                allPlayers={teamPlayers}
                selectedPlayerIds={selectedPlayerIds}
                onSelectionChange={setSelectedPlayerIds}
                teamLists={teamLists}
                onTeamListSave={handleTeamListSave}
                onTeamListDelete={handleTeamListDelete}
                onTeamListLoad={handleTeamListLoad}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleCreateTournament}
                disabled={!tournamentName.trim() || selectedPlayerIds.length < 4}
                className="field-gradient text-white"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Criar Campeonato
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancelar
              </Button>
            </div>
            
            {selectedPlayerIds.length > 0 && selectedPlayerIds.length < 4 && (
              <p className="text-sm text-muted-foreground">
                Mínimo de 4 jogadores necessário para criar um campeonato.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tournaments Grid */}
      {!selectedTournament && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="smooth-transition hover:field-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{tournament.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tournament.description || "Sem descrição"}
                    </p>
                  </div>
                  {isTeamAdmin(activeTeam?.id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTournament(tournament.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge variant={
                    tournament.status === "setup" ? "secondary" :
                    tournament.status === "active" ? "default" : "outline"
                  }>
                    {tournament.status === "setup" ? "Configuração" :
                     tournament.status === "active" ? "Em Andamento" : "Finalizado"}
                  </Badge>
                  <Badge variant="outline">
                    {tournament.tournament_type === 'single_elimination' ? 'Eliminatórias' : 'Ida e Volta'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Criado em: {new Date(tournament.created_at).toLocaleDateString('pt-BR')}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTournament(tournament)}
                    className="flex-1"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Ver Chaveamento
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {tournaments.length === 0 && !showCreateForm && !selectedTournament && (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum campeonato criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro campeonato para organizar torneios do seu time
            </p>
            {isTeamAdmin(activeTeam?.id) && (
              <Button onClick={() => setShowCreateForm(true)} className="field-gradient text-white">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Campeonato
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Match Dialog */}
      <TournamentMatchDialog
        match={selectedMatch}
        isOpen={showMatchDialog}
        onClose={() => setShowMatchDialog(false)}
        isAdmin={isTeamAdmin(activeTeam?.id)}
      />
    </div>
  );
}