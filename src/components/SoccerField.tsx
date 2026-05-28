import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitialsAvatar } from "@/lib/avatar";

interface FieldPlayer {
  id: string;
  name: string;
  nickname: string;
  position: string;
  profile_image?: string;
}

interface Team {
  name: string;
  logo?: string;
  coachPhoto?: string;
  players: FieldPlayer[];
}

interface SoccerFieldProps {
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
}

export function SoccerField({ teamA, teamB, scoreA, scoreB }: SoccerFieldProps) {
  // Field positions for Team A (left side) - 4-3-3 formation
  const teamAPositions = {
    goalkeeper: { x: 8, y: 50 },
    defenders: [
      { x: 22, y: 25 },
      { x: 22, y: 40 },
      { x: 22, y: 60 },
      { x: 22, y: 75 }
    ],
    midfielders: [
      { x: 38, y: 35 },
      { x: 38, y: 50 },
      { x: 38, y: 65 }
    ],
    forwards: [
      { x: 52, y: 30 },
      { x: 52, y: 50 },
      { x: 52, y: 70 }
    ]
  };

  // Field positions for Team B (right side) - 4-3-3 formation mirrored
  const teamBPositions = {
    goalkeeper: { x: 92, y: 50 },
    defenders: [
      { x: 78, y: 25 },
      { x: 78, y: 40 },
      { x: 78, y: 60 },
      { x: 78, y: 75 }
    ],
    midfielders: [
      { x: 62, y: 35 },
      { x: 62, y: 50 },
      { x: 62, y: 65 }
    ],
    forwards: [
      { x: 48, y: 30 },
      { x: 48, y: 50 },
      { x: 48, y: 70 }
    ]
  };

  const PlayerBall = ({ player, position, team }: { player: FieldPlayer; position: { x: number; y: number }; team: 'A' | 'B' }) => (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%` 
      }}
    >
      {/* Player ball */}
      <div className={`w-8 h-8 rounded-full border-2 shadow-lg transition-all duration-200 group-hover:scale-110 ${
        team === 'A' 
          ? 'bg-blue-500 border-blue-700' 
          : 'bg-red-500 border-red-700'
      }`}>
        {player.profile_image ? (
          <Avatar className="w-full h-full">
            <AvatarImage src={player.profile_image || getInitialsAvatar(player.name)} />
            <AvatarFallback className="text-xs text-white bg-transparent">
              {player.nickname.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
            {player.nickname.charAt(0)}
          </div>
        )}
      </div>
      
      {/* Player info tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          <div className="font-semibold">{player.nickname}</div>
          <div className="text-gray-300">{player.position}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full aspect-[16/10] relative bg-gradient-to-b from-green-400 to-green-500 rounded-lg overflow-hidden shadow-lg border-4 border-white">
      {/* Field markings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60">
        {/* Outer field lines */}
        <rect x="2" y="2" width="96" height="56" fill="none" stroke="white" strokeWidth="0.3" />
        
        {/* Center line */}
        <line x1="50" y1="2" x2="50" y2="58" stroke="white" strokeWidth="0.3" />
        
        {/* Center circle */}
        <circle cx="50" cy="30" r="8" fill="none" stroke="white" strokeWidth="0.3" />
        <circle cx="50" cy="30" r="0.5" fill="white" />
        
        {/* Left penalty area */}
        <rect x="2" y="14" width="14" height="32" fill="none" stroke="white" strokeWidth="0.3" />
        <rect x="2" y="20" width="6" height="20" fill="none" stroke="white" strokeWidth="0.3" />
        
        {/* Right penalty area */}
        <rect x="84" y="14" width="14" height="32" fill="none" stroke="white" strokeWidth="0.3" />
        <rect x="92" y="20" width="6" height="20" fill="none" stroke="white" strokeWidth="0.3" />
        
        {/* Goals */}
        <rect x="0" y="24" width="2" height="12" fill="none" stroke="white" strokeWidth="0.3" />
        <rect x="98" y="24" width="2" height="12" fill="none" stroke="white" strokeWidth="0.3" />
        
        {/* Corner arcs */}
        <path d="M 2 2 A 2 2 0 0 0 4 4" fill="none" stroke="white" strokeWidth="0.3" />
        <path d="M 98 2 A 2 2 0 0 1 96 4" fill="none" stroke="white" strokeWidth="0.3" />
        <path d="M 2 58 A 2 2 0 0 1 4 56" fill="none" stroke="white" strokeWidth="0.3" />
        <path d="M 98 58 A 2 2 0 0 0 96 56" fill="none" stroke="white" strokeWidth="0.3" />
      </svg>

      {/* Team A Corner (top left) */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        {teamA.logo ? (
          <Avatar className="w-12 h-12">
            <AvatarImage src={teamA.logo} />
            <AvatarFallback className="bg-blue-600 text-white font-bold">
              {teamA.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ) : teamA.coachPhoto ? (
          <Avatar className="w-12 h-12">
            <AvatarImage src={teamA.coachPhoto} />
            <AvatarFallback className="bg-blue-600 text-white">T</AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            {teamA.name.charAt(0)}
          </div>
        )}
        <div className="text-white">
          <div className="font-bold text-lg">{scoreA}</div>
          <div className="text-sm opacity-90">{teamA.name}</div>
        </div>
      </div>

      {/* Team B Corner (top right) */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="text-white text-right">
          <div className="font-bold text-lg">{scoreB}</div>
          <div className="text-sm opacity-90">{teamB.name}</div>
        </div>
        {teamB.logo ? (
          <Avatar className="w-12 h-12">
            <AvatarImage src={teamB.logo} />
            <AvatarFallback className="bg-red-600 text-white font-bold">
              {teamB.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ) : teamB.coachPhoto ? (
          <Avatar className="w-12 h-12">
            <AvatarImage src={teamB.coachPhoto} />
            <AvatarFallback className="bg-red-600 text-white">T</AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
            {teamB.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Team A Players */}
      {teamA.players.slice(0, 11).map((player, index) => {
        let position;
        if (index === 0) {
          position = teamAPositions.goalkeeper;
        } else if (index <= 4) {
          position = teamAPositions.defenders[index - 1];
        } else if (index <= 7) {
          position = teamAPositions.midfielders[index - 5];
        } else {
          position = teamAPositions.forwards[index - 8];
        }
        
        return (
          <PlayerBall
            key={player.id}
            player={player}
            position={position}
            team="A"
          />
        );
      })}

      {/* Team B Players */}
      {teamB.players.slice(0, 11).map((player, index) => {
        let position;
        if (index === 0) {
          position = teamBPositions.goalkeeper;
        } else if (index <= 4) {
          position = teamBPositions.defenders[index - 1];
        } else if (index <= 7) {
          position = teamBPositions.midfielders[index - 5];
        } else {
          position = teamBPositions.forwards[index - 8];
        }
        
        return (
          <PlayerBall
            key={player.id}
            player={player}
            position={position}
            team="B"
          />
        );
      })}

      {/* Coach positions */}
      <div className="absolute bottom-4 left-1/4 transform -translate-x-1/2">
        <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2">
          {teamA.coachPhoto ? (
            <Avatar className="w-6 h-6">
              <AvatarImage src={teamA.coachPhoto} />
              <AvatarFallback className="bg-blue-600 text-white text-xs">T</AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
              T
            </div>
          )}
          <Badge variant="secondary" className="text-xs">Técnico</Badge>
        </div>
      </div>

      <div className="absolute bottom-4 right-1/4 transform translate-x-1/2">
        <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2">
          <Badge variant="secondary" className="text-xs">Técnico</Badge>
          {teamB.coachPhoto ? (
            <Avatar className="w-6 h-6">
              <AvatarImage src={teamB.coachPhoto} />
              <AvatarFallback className="bg-red-600 text-white text-xs">T</AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">
              T
            </div>
          )}
        </div>
      </div>
    </div>
  );
}