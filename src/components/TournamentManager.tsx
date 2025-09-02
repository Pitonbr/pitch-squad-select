import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Trophy, 
  Users, 
  Plus,
  Trash2,
  Shuffle,
  Calendar,
  MapPin,
  Clock
} from "lucide-react";

interface TournamentPlayer {
  id: string;
  name: string;
  nickname: string;
  teamName: string;
}

interface Match {
  id: string;
  team1: string;
  team2: string;
  date?: string;
  time?: string;
  location?: string;
  score?: { team1: number; team2: number };
  status: "upcoming" | "ongoing" | "completed";
}

interface Tournament {
  id: string;
  name: string;
  description: string;
  players: TournamentPlayer[];
  matches: Match[];
  status: "setup" | "ongoing" | "completed";
  createdAt: string;
}

export function TournamentManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  
  // Create tournament form state
  const [tournamentName, setTournamentName] = useState("");
  const [tournamentDescription, setTournamentDescription] = useState("");
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerTeam, setNewPlayerTeam] = useState("");

  const addPlayer = () => {
    if (newPlayerName.trim() && newPlayerTeam.trim() && players.length < 50) {
      const newPlayer: TournamentPlayer = {
        id: Date.now().toString(),
        name: newPlayerName.trim(),
        nickname: newPlayerName.trim().split(' ')[0],
        teamName: newPlayerTeam.trim()
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName("");
      setNewPlayerTeam("");
    }
  };

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const generateMatches = (tournamentPlayers: TournamentPlayer[]): Match[] => {
    const shuffled = [...tournamentPlayers].sort(() => Math.random() - 0.5);
    const matches: Match[] = [];
    
    // Create bracket pairs
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      if (shuffled[i + 1]) {
        matches.push({
          id: Date.now().toString() + i,
          team1: shuffled[i].teamName,
          team2: shuffled[i + 1].teamName,
          status: "upcoming"
        });
      }
    }
    
    return matches;
  };

  const createTournament = () => {
    if (tournamentName.trim() && players.length >= 2) {
      const matches = generateMatches(players);
      
      const newTournament: Tournament = {
        id: Date.now().toString(),
        name: tournamentName.trim(),
        description: tournamentDescription.trim(),
        players: [...players],
        matches,
        status: "setup",
        createdAt: new Date().toISOString()
      };
      
      setTournaments([...tournaments, newTournament]);
      
      // Reset form
      setTournamentName("");
      setTournamentDescription("");
      setPlayers([]);
      setShowCreateForm(false);
    }
  };

  const deleteTournament = (tournamentId: string) => {
    setTournaments(tournaments.filter(t => t.id !== tournamentId));
    if (selectedTournament === tournamentId) {
      setSelectedTournament(null);
    }
  };

  const selectedTournamentData = tournaments.find(t => t.id === selectedTournament);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Campeonatos</h2>
          <p className="text-muted-foreground">Crie e gerencie torneios em formato playoffs</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="field-gradient text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Campeonato
        </Button>
      </div>

      {/* Create Tournament Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Campeonato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tournament-name">Nome do Campeonato</Label>
                <Input
                  id="tournament-name"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  placeholder="Ex: Copa Soccer Squad 2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Total de Jogadores: {players.length}/50</Label>
                <Badge variant="outline" className="w-fit">
                  <Users className="h-3 w-3 mr-1" />
                  {players.length} inscritos
                </Badge>
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

            {/* Add Players */}
            <div className="space-y-4">
              <h4 className="font-semibold">Adicionar Jogadores</h4>
              <div className="flex gap-2">
                <Input
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Nome do jogador"
                  className="flex-1"
                />
                <Input
                  value={newPlayerTeam}
                  onChange={(e) => setNewPlayerTeam(e.target.value)}
                  placeholder="Nome do time"
                  className="flex-1"
                />
                <Button 
                  onClick={addPlayer}
                  disabled={players.length >= 50}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Players List */}
              {players.length > 0 && (
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  <div className="grid gap-2">
                    {players.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div>
                          <span className="font-medium">{player.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">- {player.teamName}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePlayer(player.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={createTournament}
                disabled={!tournamentName.trim() || players.length < 2}
                className="field-gradient text-white"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Criar Campeonato
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournaments Grid */}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTournament(tournament.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Badge variant={
                  tournament.status === "setup" ? "secondary" :
                  tournament.status === "ongoing" ? "default" : "outline"
                }>
                  {tournament.status === "setup" ? "Configuração" :
                   tournament.status === "ongoing" ? "Em Andamento" : "Finalizado"}
                </Badge>
                <Badge variant="outline">
                  {tournament.players.length} jogadores
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Criado em: {new Date(tournament.createdAt).toLocaleDateString('pt-BR')}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTournament(
                    selectedTournament === tournament.id ? null : tournament.id
                  )}
                  className="flex-1"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  {selectedTournament === tournament.id ? "Fechar" : "Ver Detalhes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tournament Details */}
      {selectedTournamentData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {selectedTournamentData.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Players */}
            <div>
              <h4 className="font-semibold mb-3">Jogadores Inscritos ({selectedTournamentData.players.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {selectedTournamentData.players.map((player) => (
                  <div key={player.id} className="p-2 border rounded text-sm">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-muted-foreground">Time: {player.teamName}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Matches */}
            <div>
              <h4 className="font-semibold mb-3">Jogos ({selectedTournamentData.matches.length})</h4>
              <div className="space-y-2">
                {selectedTournamentData.matches.map((match) => (
                  <div key={match.id} className="p-3 border rounded flex items-center justify-between">
                    <div>
                      <span className="font-medium">{match.team1}</span>
                      <span className="mx-2 text-muted-foreground">vs</span>
                      <span className="font-medium">{match.team2}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {match.status === "upcoming" ? "Agendado" :
                         match.status === "ongoing" ? "Em Andamento" : "Finalizado"}
                      </Badge>
                      {match.score && (
                        <span className="text-sm font-medium">
                          {match.score.team1} x {match.score.team2}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tournaments.length === 0 && !showCreateForm && (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum campeonato criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro campeonato para organizar torneios em formato playoffs
            </p>
            <Button onClick={() => setShowCreateForm(true)} className="field-gradient text-white">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Campeonato
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}