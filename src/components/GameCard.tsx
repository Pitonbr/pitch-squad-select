import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Timer, X } from "lucide-react";

interface GameCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  playersCheckedIn: number;
  totalPlayers: number;
  timeLeft?: string;
  status: "upcoming" | "checkin" | "closed" | "ongoing" | "cancelled";
  onJoinGame?: () => void;
  onCancelGame?: () => void;
  isAdmin?: boolean;
}

const statusConfig = {
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
  cancelled: {
    badge: "bg-destructive text-destructive-foreground",
    text: "Cancelado"
  }
};

export function GameCard({ 
  title, 
  date, 
  time, 
  location, 
  playersCheckedIn, 
  totalPlayers, 
  timeLeft, 
  status,
  onJoinGame,
  onCancelGame,
  isAdmin = false
}: GameCardProps) {
  return (
    <Card 
      variant="dark" 
      className="smooth-transition hover:shadow-[0_0_20px_rgba(63,184,175,0.3)] backdrop-blur-md"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-white">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={statusConfig[status].badge}>
              {statusConfig[status].text}
            </Badge>
            {isAdmin && status !== "cancelled" && onCancelGame && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelGame}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-white/80">
            <Users className="h-4 w-4 text-primary" />
            <span>{playersCheckedIn}/{totalPlayers} jogadores</span>
            <div className="w-20 bg-black/40 rounded-full h-2 border border-primary/30">
              <div 
                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(playersCheckedIn / totalPlayers) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        {timeLeft && status === "checkin" && (
          <div className="flex items-center space-x-2 text-sm text-warning">
            <Timer className="h-4 w-4" />
            <span>Fecha em: {timeLeft}</span>
          </div>
        )}
        
        {onJoinGame && status === "checkin" && (
          <Button 
            className="w-full bg-primary hover:bg-accent text-white font-semibold transition-colors" 
            onClick={onJoinGame}
          >
            Participar do Jogo
          </Button>
        )}
      </CardContent>
    </Card>
  );
}