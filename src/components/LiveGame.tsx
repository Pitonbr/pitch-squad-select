import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SoccerField } from "@/components/SoccerField";
import { 
  Play, 
  Pause, 
  Clock, 
  Trophy,
  Target,
  Heart,
  Square,
  Shield,
  AlertTriangle,
  Zap,
  Edit,
  RefreshCw,
  User,
  UserCheck,
  ArrowUpDown
} from "lucide-react";

interface PlayerStats {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  difficultDefenses: number;
  tackles: number;
}

interface LivePlayer {
  id: string;
  name: string;
  nickname: string;
  position: string;
  isStarter: boolean;
  stats: PlayerStats;
}

interface Team {
  name: string;
  players: LivePlayer[];
  score: number;
}

export function LiveGame() {
  const [gameTime, setGameTime] = useState("45:30");
  const [isRunning, setIsRunning] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [substitutionMode, setSubstitutionMode] = useState(false);
  const [playerOut, setPlayerOut] = useState<string | null>(null);
  const [playerIn, setPlayerIn] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const [teamA, setTeamA] = useState<Team>({
    name: "Time Azul",
    players: [
      {
        id: "1",
        name: "Carlos Silva",
        nickname: "Carlão",
        position: "Atacante",
        isStarter: true,
        stats: { goals: 2, assists: 1, yellowCards: 0, redCards: 0, difficultDefenses: 0, tackles: 3 }
      },
      {
        id: "2",
        name: "João Santos",
        nickname: "Joãozinho",
        position: "Goleiro",
        isStarter: true,
        stats: { goals: 0, assists: 0, yellowCards: 1, redCards: 0, difficultDefenses: 4, tackles: 0 }
      },
      {
        id: "3",
        name: "Pedro Costa",
        nickname: "Pedrinho",
        position: "Zagueiro",
        isStarter: false,
        stats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, difficultDefenses: 0, tackles: 5 }
      },
      {
        id: "7",
        name: "Marcos Oliveira",
        nickname: "Marquinhos",
        position: "Meio-campo",
        isStarter: true,
        stats: { goals: 0, assists: 2, yellowCards: 0, redCards: 0, difficultDefenses: 0, tackles: 4 }
      },
      {
        id: "8",
        name: "Fernando Silva",
        nickname: "Fernandinho",
        position: "Atacante",
        isStarter: false,
        stats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, difficultDefenses: 0, tackles: 1 }
      }
    ],
    score: 2
  });

  const [teamB, setTeamB] = useState<Team>({
    name: "Time Vermelho",
    players: [
      {
        id: "4",
        name: "Lucas Oliveira",
        nickname: "Lukão",
        position: "Atacante",
        isStarter: true,
        stats: { goals: 1, assists: 2, yellowCards: 0, redCards: 0, difficultDefenses: 0, tackles: 2 }
      },
      {
        id: "5",
        name: "Rafael Lima",
        nickname: "Rafa",
        position: "Meio-campo",
        isStarter: true,
        stats: { goals: 0, assists: 1, yellowCards: 1, redCards: 0, difficultDefenses: 0, tackles: 4 }
      },
      {
        id: "6",
        name: "Diego Santos",
        nickname: "Dieguinho",
        position: "Zagueiro",
        isStarter: false,
        stats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, difficultDefenses: 0, tackles: 3 }
      },
      {
        id: "9",
        name: "Gabriel Costa",
        nickname: "Gabigol",
        position: "Atacante",
        isStarter: false,
        stats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, difficultDefenses: 0, tackles: 0 }
      }
    ],
    score: 1
  });

  const updatePlayerStat = (teamName: string, playerId: string, stat: keyof PlayerStats, increment: boolean = true) => {
    const updateTeam = teamName === "Time Azul" ? setTeamA : setTeamB;
    const team = teamName === "Time Azul" ? teamA : teamB;
    
    updateTeam({
      ...team,
      players: team.players.map(player => 
        player.id === playerId
          ? {
              ...player,
              stats: {
                ...player.stats,
                [stat]: increment 
                  ? Math.min(10, player.stats[stat] + 1) 
                  : Math.max(0, player.stats[stat] - 1)
              }
            }
          : player
      )
    });
  };

  const updateScore = (team: "A" | "B", increment: boolean = true) => {
    if (team === "A") {
      setTeamA({
        ...teamA,
        score: increment ? teamA.score + 1 : Math.max(0, teamA.score - 1)
      });
    } else {
      setTeamB({
        ...teamB,
        score: increment ? teamB.score + 1 : Math.max(0, teamB.score - 1)
      });
    }
  };

  const makeSubstitution = () => {
    if (!playerOut || !playerIn || !selectedTeam) return;
    
    const updateTeam = selectedTeam === "Time Azul" ? setTeamA : setTeamB;
    const team = selectedTeam === "Time Azul" ? teamA : teamB;
    
    updateTeam({
      ...team,
      players: team.players.map(player => {
        if (player.id === playerOut) {
          return { ...player, isStarter: false };
        }
        if (player.id === playerIn) {
          return { ...player, isStarter: true };
        }
        return player;
      })
    });

    // Reset substitution mode
    setSubstitutionMode(false);
    setPlayerOut(null);
    setPlayerIn(null);
    setSelectedTeam(null);
  };

  const cancelSubstitution = () => {
    setSubstitutionMode(false);
    setPlayerOut(null);
    setPlayerIn(null);
    setSelectedTeam(null);
  };


  return (
    <div className="space-y-6">
      {/* Game Header */}
      <Card className="field-gradient text-white">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <Input
                  value={gameTime}
                  onChange={(e) => setGameTime(e.target.value)}
                  className="w-20 text-center bg-white/20 border-white/30 text-white placeholder:text-white/70"
                />
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Pelada da Galera - Sábado</h2>
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <p className="text-sm opacity-90">{teamA.name}</p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateScore("A", false)}
                    >
                      -
                    </Button>
                    <span className="text-4xl font-bold mx-4">{teamA.score}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateScore("A")}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <div className="text-3xl font-bold">×</div>
                
                <div className="text-center">
                  <p className="text-sm opacity-90">{teamB.name}</p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateScore("B", false)}
                    >
                      -
                    </Button>
                    <span className="text-4xl font-bold mx-4">{teamB.score}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => updateScore("B")}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <Button variant="secondary" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Soccer Field Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Campo de Jogo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SoccerField
            teamA={{
              name: teamA.name,
              players: teamA.players.map(p => ({
                id: p.id,
                name: p.name,
                nickname: p.nickname,
                position: p.position,
                photo: undefined // Add photo upload functionality later
              }))
            }}
            teamB={{
              name: teamB.name,
              players: teamB.players.map(p => ({
                id: p.id,
                name: p.name,
                nickname: p.nickname,
                position: p.position,
                photo: undefined // Add photo upload functionality later
              }))
            }}
            scoreA={teamA.score}
            scoreB={teamB.score}
          />
        </CardContent>
      </Card>

      {/* Substitution Controls */}
      {substitutionMode && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <ArrowUpDown className="h-5 w-5" />
              Modo Substituição {selectedTeam && `- ${selectedTeam}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Jogador que sai:</p>
                <div className="space-y-1">
                  {selectedTeam && (selectedTeam === "Time Azul" ? teamA : teamB).players
                    .filter(p => p.isStarter)
                    .map(player => (
                      <Button
                        key={player.id}
                        variant={playerOut === player.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlayerOut(player.id)}
                        className="w-full justify-start"
                      >
                        <User className="h-4 w-4 mr-2" />
                        {player.nickname} - {player.position}
                      </Button>
                    ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Jogador que entra:</p>
                <div className="space-y-1">
                  {selectedTeam && (selectedTeam === "Time Azul" ? teamA : teamB).players
                    .filter(p => !p.isStarter)
                    .map(player => (
                      <Button
                        key={player.id}
                        variant={playerIn === player.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlayerIn(player.id)}
                        className="w-full justify-start"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        {player.nickname} - {player.position}
                      </Button>
                    ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={makeSubstitution}
                disabled={!playerOut || !playerIn}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Confirmar Substituição
              </Button>
              <Button 
                variant="outline" 
                onClick={cancelSubstitution}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Lists */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Team A */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Trophy className="h-5 w-5" />
                {teamA.name}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubstitutionMode(true);
                  setSelectedTeam(teamA.name);
                }}
                disabled={substitutionMode || !teamA.players.some(p => !p.isStarter)}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Substituir
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Titulares */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                TITULARES ({teamA.players.filter(p => p.isStarter).length})
              </h4>
              <div className="space-y-2">
                {teamA.players.filter(p => p.isStarter).map(player => (
                  <div 
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 smooth-transition ${
                      selectedPlayer === player.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedPlayer(selectedPlayer === player.id ? null : player.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{player.nickname}</p>
                        <p className="text-xs text-muted-foreground">{player.position}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePlayerStat(teamA.name, player.id, "difficultDefenses");
                        }}
                        className="h-8 w-10 p-0 hover:bg-blue/10"
                      >
                        <Badge variant="secondary" className="text-xs bg-blue/20 text-blue border-blue/30">
                          DF{player.stats.difficultDefenses}
                        </Badge>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePlayerStat(teamA.name, player.id, "goals");
                        }}
                        className="h-8 w-10 p-0 hover:bg-success/10"
                      >
                        <Badge variant="secondary" className="text-xs bg-success/20 text-success border-success/30">
                          G{player.stats.goals}
                        </Badge>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePlayerStat(teamA.name, player.id, "assists");
                        }}
                        className="h-8 w-10 p-0 hover:bg-primary/10"
                      >
                        <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                          A{player.stats.assists}
                        </Badge>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePlayerStat(teamA.name, player.id, "tackles");
                        }}
                        className="h-8 w-10 p-0 hover:bg-purple/10"
                      >
                        <Badge variant="secondary" className="text-xs bg-purple/20 text-purple border-purple/30">
                          DS{player.stats.tackles}
                        </Badge>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePlayerStat(teamA.name, player.id, "yellowCards");
                        }}
                        className="h-8 w-10 p-0 hover:bg-warning/10"
                      >
                        <Badge variant="secondary" className="text-xs bg-warning/20 text-warning border-warning/30">
                          CA{player.stats.yellowCards}
                        </Badge>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePlayerStat(teamA.name, player.id, "redCards");
                        }}
                        className="h-8 w-10 p-0 hover:bg-destructive/10"
                      >
                        <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive border-destructive/30">
                          CV{player.stats.redCards}
                        </Badge>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reservas */}
            {teamA.players.some(p => !p.isStarter) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    RESERVAS ({teamA.players.filter(p => !p.isStarter).length})
                  </h4>
                  <div className="space-y-2">
                    {teamA.players.filter(p => !p.isStarter).map(player => (
                      <div 
                        key={player.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 smooth-transition opacity-75"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{player.nickname}</p>
                            <p className="text-xs text-muted-foreground">{player.position}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            Reserva
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Team B */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trophy className="h-5 w-5" />
                {teamB.name}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubstitutionMode(true);
                  setSelectedTeam(teamB.name);
                }}
                disabled={substitutionMode || !teamB.players.some(p => !p.isStarter)}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Substituir
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Titulares */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                TITULARES ({teamB.players.filter(p => p.isStarter).length})
              </h4>
              <div className="space-y-2">
                {teamB.players.filter(p => p.isStarter).map(player => (
                  <div 
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 smooth-transition ${
                      selectedPlayer === player.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedPlayer(selectedPlayer === player.id ? null : player.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{player.nickname}</p>
                        <p className="text-xs text-muted-foreground">{player.position}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePlayerStat(teamB.name, player.id, "difficultDefenses");
                        }}
                        className="h-8 w-10 p-0 hover:bg-blue/10"
                      >
                        <Badge variant="secondary" className="text-xs bg-blue/20 text-blue border-blue/30">
                          DF{player.stats.difficultDefenses}
                        </Badge>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePlayerStat(teamB.name, player.id, "goals");
                        }}
                        className="h-8 w-10 p-0 hover:bg-success/10"
                      >
                        <Badge variant="secondary" className="text-xs bg-success/20 text-success border-success/30">
                          G{player.stats.goals}
                        </Badge>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePlayerStat(teamB.name, player.id, "assists");
                        }}
                        className="h-8 w-10 p-0 hover:bg-primary/10"
                      >
                        <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                          A{player.stats.assists}
                        </Badge>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePlayerStat(teamB.name, player.id, "tackles");
                        }}
                        className="h-8 w-10 p-0 hover:bg-purple/10"
                      >
                        <Badge variant="secondary" className="text-xs bg-purple/20 text-purple border-purple/30">
                          DS{player.stats.tackles}
                        </Badge>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePlayerStat(teamB.name, player.id, "yellowCards");
                        }}
                        className="h-8 w-10 p-0 hover:bg-warning/10"
                      >
                        <Badge variant="secondary" className="text-xs bg-warning/20 text-warning border-warning/30">
                          CA{player.stats.yellowCards}
                        </Badge>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePlayerStat(teamB.name, player.id, "redCards");
                        }}
                        className="h-8 w-10 p-0 hover:bg-destructive/10"
                      >
                        <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive border-destructive/30">
                          CV{player.stats.redCards}
                        </Badge>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reservas */}
            {teamB.players.some(p => !p.isStarter) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    RESERVAS ({teamB.players.filter(p => !p.isStarter).length})
                  </h4>
                  <div className="space-y-2">
                    {teamB.players.filter(p => !p.isStarter).map(player => (
                      <div 
                        key={player.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 smooth-transition opacity-75"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{player.nickname}</p>
                            <p className="text-xs text-muted-foreground">{player.position}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            Reserva
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}