import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Phone, MapPin, Clock } from "lucide-react";

interface PlayerCardProps {
  name: string;
  nickname: string;
  position: string;
  phone: string;
  checkedIn?: boolean;
  onCheckIn?: () => void;
}

const positionColors: Record<string, string> = {
  "Goleiro": "bg-warning text-warning-foreground",
  "Zagueiro": "bg-teamA text-teamA-foreground",
  "Lateral": "bg-primary text-primary-foreground",
  "Volante": "bg-secondary text-secondary-foreground",
  "Meia": "bg-accent text-accent-foreground",
  "Atacante": "bg-teamB text-teamB-foreground"
};

export function PlayerCard({ name, nickname, position, phone, checkedIn, onCheckIn }: PlayerCardProps) {
  return (
    <Card className={`smooth-transition hover:team-shadow ${checkedIn ? 'ring-2 ring-success' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${checkedIn ? 'bg-success text-success-foreground' : 'bg-muted'}`}>
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{name}</h3>
              <p className="text-xs text-muted-foreground">"{nickname}"</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${positionColors[position] || 'bg-muted'}`}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {position}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="text-right space-y-2">
            <div className="flex items-center text-xs text-muted-foreground">
              <Phone className="h-3 w-3 mr-1" />
              {phone}
            </div>
            {onCheckIn && !checkedIn && (
              <Button 
                size="sm" 
                variant="default"
                className="field-gradient text-xs"
                onClick={onCheckIn}
              >
                <Clock className="h-3 w-3 mr-1" />
                Check-in
              </Button>
            )}
            {checkedIn && (
              <Badge variant="default" className="bg-success text-success-foreground text-xs">
                ✓ Confirmado
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}