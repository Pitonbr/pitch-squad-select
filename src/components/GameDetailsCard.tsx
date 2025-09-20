import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Edit, Send, Timer } from "lucide-react";

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
  status: "upcoming" | "checkin" | "closed" | "ongoing" | "cancelled";
  onEdit?: () => void;
  onInvite?: () => void;
  onJoin?: () => void;
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
  onEdit,
  onInvite,
  onJoin,
  isAdmin = false
}: GameDetailsCardProps) {
  return (
    <Card className="smooth-transition hover:field-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold mb-2">{title}</CardTitle>
            <Badge className={statusConfig[status].badge}>
              {statusConfig[status].text}
            </Badge>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              )}
              {onInvite && status !== "cancelled" && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onInvite}
                  className="gap-2 field-gradient"
                >
                  <Send className="h-4 w-4" />
                  Convidar
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{date}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{time}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{location}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{playersCheckedIn}/{totalPlayers} jogadores confirmados</span>
          </div>
          <div className="w-24 bg-muted rounded-full h-2">
            <div 
              className="field-gradient h-2 rounded-full transition-all duration-300" 
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
          <Button className="w-full field-gradient font-semibold" onClick={onJoin}>
            Participar do Jogo
          </Button>
        )}
      </CardContent>
    </Card>
  );
}