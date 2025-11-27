import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Edit, Send, Timer, UserPlus } from "lucide-react";
import { GameInviteLink } from "./GameInviteLink";
import { GamePlayerManager } from "./GamePlayerManager";
import { useState } from "react";

interface Player {
  id: string;
  name: string;
  nickname: string;
  position: string;
  phone: string;
  email?: string;
  profile_image?: string;
  checkedIn?: boolean;
}

interface GameDetailsCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  playersCheckedIn: number;
  totalPlayers: number;
  timeLeft?: string;
  status: "scheduled" | "upcoming" | "checkin" | "closed" | "ongoing" | "finished" | "not_realized" | "cancelled";
  homeScore?: number;
  awayScore?: number;
  onEdit?: () => void;
  onInvite?: () => void;
  onJoin?: () => void;
  isAdmin?: boolean;
  allPlayers?: Player[];
  invitedPlayers?: Player[];
  createdByName?: string;
  onPlayersUpdate?: (updatedPlayers: Player[]) => void;
}

const statusConfig = {
  scheduled: {
    badge: "bg-muted text-muted-foreground",
    text: "Agendado"
  },
  upcoming: {
    badge: "bg-muted text-muted-foreground",
    text: "Em Breve"
  },
  checkin: {
    badge: "bg-primary text-primary-foreground field-gradient",
    text: "Check-in Aberto"
  },
  closed: {
    badge: "bg-warning text-warning-foreground",
    text: "Check-in Fechado"
  },
  ongoing: {
    badge: "bg-success text-success-foreground",
    text: "Em Andamento"
  },
  finished: {
    badge: "bg-success text-success-foreground",
    text: "Finalizado"
  },
  not_realized: {
    badge: "bg-gray-500 text-white",
    text: "Não Realizado"
  },
  cancelled: {
    badge: "bg-destructive text-destructive-foreground",
    text: "Cancelado"
  }
};

export function GameDetailsCard({
  id,
  title,
  date,
  time,
  location,
  description,
  playersCheckedIn,
  totalPlayers,
  timeLeft,
  status,
  homeScore,
  awayScore,
  onEdit,
  onInvite,
  onJoin,
  isAdmin = false,
  allPlayers = [],
  invitedPlayers = [],
  createdByName = "Administrador",
  onPlayersUpdate
}: GameDetailsCardProps) {
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [showPlayerManager, setShowPlayerManager] = useState(false);
  return (
    <Card 
      variant="dark" 
      className="smooth-transition hover:shadow-[0_0_20px_rgba(63,184,175,0.3)] backdrop-blur-md"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold mb-2 text-white">{title}</CardTitle>
            <Badge className={(statusConfig[status] || statusConfig.scheduled).badge}>
              {(statusConfig[status] || statusConfig.scheduled).text}
            </Badge>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2 flex-wrap">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="gap-2 border-primary/50 text-white hover:bg-primary/20"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPlayerManager(!showPlayerManager)}
                className="gap-2 border-primary/50 text-white hover:bg-primary/20"
              >
                <UserPlus className="h-4 w-4" />
                Jogadores
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowInviteLink(!showInviteLink)}
                className="gap-2 bg-primary hover:bg-accent text-white transition-colors"
              >
                <Send className="h-4 w-4" />
                Convites
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {description && (
          <p className="text-sm text-white/70">{description}</p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-sm text-white/80">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{date}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-white/80">
            <Clock className="h-4 w-4 text-primary" />
            <span>{time}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-white/80">
          <MapPin className="h-4 w-4 text-primary" />
          <span>{location}</span>
        </div>

        {/* Show score for finished games */}
        {status === 'finished' && homeScore !== undefined && awayScore !== undefined && (
          <div className="text-center p-3 bg-black/40 rounded-lg border border-primary/30">
            <p className="text-xs text-white/70 mb-2">Placar Final</p>
            <p className="text-3xl font-bold text-accent">
              {homeScore} x {awayScore}
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-white/80">
            <Users className="h-4 w-4 text-primary" />
            <span>{playersCheckedIn}/{totalPlayers} jogadores confirmados</span>
          </div>
          <div className="w-24 bg-black/40 rounded-full h-2 border border-primary/30">
            <div 
              className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min((playersCheckedIn / totalPlayers) * 100, 100)}%` }}
            />
          </div>
        </div>
        
        {timeLeft && status === "checkin" && (
          <div className="flex items-center space-x-2 text-sm text-warning">
            <Timer className="h-4 w-4" />
            <span>Fecha em: {timeLeft}</span>
          </div>
        )}
        
        {onJoin && status === "checkin" && !isAdmin && (
          <Button 
            className="w-full bg-primary hover:bg-accent text-white font-semibold transition-colors" 
            onClick={onJoin}
          >
            Participar do Jogo
          </Button>
        )}

        {/* Game Invite Link Section */}
        {isAdmin && showInviteLink && (
          <div className="mt-6">
            <GameInviteLink
              game={{ id, title, date, time, location, description }}
              invitedPlayers={invitedPlayers}
              createdByName={createdByName}
            />
          </div>
        )}

        {/* Player Manager Section */}
        {isAdmin && showPlayerManager && onPlayersUpdate && (
          <div className="mt-6">
            <GamePlayerManager
              gameId={id}
              allPlayers={allPlayers}
              invitedPlayers={invitedPlayers}
              onPlayersUpdate={onPlayersUpdate}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}