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
  Edit
} from "lucide-react";

interface PlayerStats {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  fouls: number;
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

  const [teamA, setTeamA] = useState<Team>({
    name: "Time Azul",
    players: [
      {
        id: "1",
        name: "Carlos Silva",
        nickname: "Carlão",
        position: "Atacante",
        isStarter: true,
        stats: { goals: 2, assists: 1, yellowCards: 0, redCards: 0, saves: 0, fouls: 1, tackles: 3 }
      },
      {
        id: "2",
        name: "João Santos",
        nickname: "Joãozinho",
        position: "Goleiro",
        isStarter: true,
        stats: { goals: 0, assists: 0, yellowCards: 1, redCards: 0, saves: 4, fouls: 0, tackles: 0 }
      },
      {
        id: "3",
        name: "Pedro Costa",
        nickname: "Pedrinho",
        position: "Zagueiro",
        isStarter: false,
        stats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, saves: 0, fouls: 2, tackles: 5 }
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
        stats: { goals: 1, assists: 2, yellowCards: 0, redCards: 0, saves: 0, fouls: 0, tackles: 2 }
      },
      {
        id: "5",
        name: "Rafael Lima",
        nickname: "Rafa",
        position: "Meio-campo",
        isStarter: true,
        stats: { goals: 0, assists: 1, yellowCards: 1, redCards: 0, saves: 0, fouls: 3, tackles: 4 }
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
                [stat]: increment ? player.stats[stat] + 1 : Math.max(0, player.stats[stat] - 1)
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

  const StatButton = ({ 
    icon: Icon, 
    label, 
    value, 
    onClick, 
    color = "primary" 
  }: { 
    icon: any; 
    label: string; 
    value: number; 
    onClick: () => void;
    color?: string;
  }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
        color === "warning" ? "border-warning text-warning hover:bg-warning/10" :
        color === "destructive" ? "border-destructive text-destructive hover:bg-destructive/10" :
        color === "success" ? "border-success text-success hover:bg-success/10" :
        "hover:field-shadow"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs font-medium">{label}</span>
      <Badge variant="secondary" className="text-xs px-1 min-w-[20px]">
        {value}
      </Badge>
    </Button>
  );

  const PlayerCard = ({ player, teamName }: { player: LivePlayer; teamName: string }) => (
    <Card className={`${selectedPlayer === player.id ? "ring-2 ring-primary" : ""} smooth-transition hover:field-shadow`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold">{player.nickname}</CardTitle>
            <p className="text-xs text-muted-foreground">{player.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={player.isStarter ? "default" : "secondary"} className="text-xs">
              {player.isStarter ? "Titular" : "Reserva"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {player.position}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <StatButton
            icon={Target}
            label="Gols"
            value={player.stats.goals}
            onClick={() => updatePlayerStat(teamName, player.id, "goals")}
            color="success"
          />
          <StatButton
            icon={Heart}
            label="Assist"
            value={player.stats.assists}
            onClick={() => updatePlayerStat(teamName, player.id, "assists")}
          />
          <StatButton
            icon={Square}
            label="Amarelo"
            value={player.stats.yellowCards}
            onClick={() => updatePlayerStat(teamName, player.id, "yellowCards")}
            color="warning"
          />
          <StatButton
            icon={Square}
            label="Vermelho"
            value={player.stats.redCards}
            onClick={() => updatePlayerStat(teamName, player.id, "redCards")}
            color="destructive"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <StatButton
            icon={Shield}
            label="Defesas"
            value={player.stats.saves}
            onClick={() => updatePlayerStat(teamName, player.id, "saves")}
          />
          <StatButton
            icon={AlertTriangle}
            label="Faltas"
            value={player.stats.fouls}
            onClick={() => updatePlayerStat(teamName, player.id, "fouls")}
          />
          <StatButton
            icon={Zap}
            label="Desarmes"
            value={player.stats.tackles}
            onClick={() => updatePlayerStat(teamName, player.id, "tackles")}
          />
        </div>
      </CardContent>
    </Card>
  );

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

      {/* Teams Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Team A */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-primary">{teamA.name}</h3>
            <Badge className="bg-primary text-primary-foreground">
              {teamA.players.filter(p => p.isStarter).length} titulares
            </Badge>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground">TITULARES</h4>
            {teamA.players.filter(p => p.isStarter).map(player => (
              <PlayerCard key={player.id} player={player} teamName={teamA.name} />
            ))}
            
            {teamA.players.some(p => !p.isStarter) && (
              <>
                <Separator />
                <h4 className="font-semibold text-sm text-muted-foreground">RESERVAS</h4>
                {teamA.players.filter(p => !p.isStarter).map(player => (
                  <PlayerCard key={player.id} player={player} teamName={teamA.name} />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Team B */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-destructive">{teamB.name}</h3>
            <Badge className="bg-destructive text-destructive-foreground">
              {teamB.players.filter(p => p.isStarter).length} titulares
            </Badge>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground">TITULARES</h4>
            {teamB.players.filter(p => p.isStarter).map(player => (
              <PlayerCard key={player.id} player={player} teamName={teamB.name} />
            ))}
            
            {teamB.players.some(p => !p.isStarter) && (
              <>
                <Separator />
                <h4 className="font-semibold text-sm text-muted-foreground">RESERVAS</h4>
                {teamB.players.filter(p => !p.isStarter).map(player => (
                  <PlayerCard key={player.id} player={player} teamName={teamB.name} />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}