import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, MapPin, Clock, MessageCircle, Mail } from "lucide-react";

interface PlayerCardProps {
  id?: string;
  name: string;
  nickname: string;
  position: string;
  phone: string;
  email?: string;
  jersey_number?: number;
  profile_image?: string;
  checkedIn?: boolean;
  onCheckIn?: (id: string) => void;
}

const positionColors: Record<string, string> = {
  "Goleiro": "bg-warning text-warning-foreground",
  "Zagueiro": "bg-teamA text-teamA-foreground",
  "Lateral": "bg-primary text-primary-foreground",
  "Volante": "bg-secondary text-secondary-foreground",
  "Meia": "bg-accent text-accent-foreground",
  "Atacante": "bg-teamB text-teamB-foreground"
};

export function PlayerCard({ 
  id, 
  name, 
  nickname, 
  position, 
  phone, 
  email, 
  jersey_number, 
  profile_image, 
  checkedIn, 
  onCheckIn 
}: PlayerCardProps) {
  const handleWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${nickname}! Tudo bem?`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    if (email) {
      const subject = encodeURIComponent('Mensagem do Time');
      const body = encodeURIComponent(`Olá ${nickname}!\n\n`);
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    }
  };

  return (
    <Card className={`smooth-transition hover:team-shadow ${checkedIn ? 'ring-2 ring-success' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 text-center">
            <Avatar className="h-12 w-12 mx-auto">
              <AvatarImage src={profile_image} alt={name} />
              <AvatarFallback className="text-sm font-semibold">
                {jersey_number || name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {jersey_number && (
              <Badge variant="outline" className="text-xs font-bold mt-1">
                #{jersey_number}
              </Badge>
            )}
          </div>
          
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm truncate">{name}</h3>
              <Badge 
                variant="secondary" 
                className={`text-xs ${positionColors[position] || 'bg-muted'}`}
              >
                <MapPin className="h-3 w-3 mr-1" />
                {position}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground mb-2">"{nickname}"</p>
            
            <div className="space-y-1 text-xs text-muted-foreground mb-3">
              <div className="flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                {phone}
              </div>
              {email && (
                <div className="flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  <span className="truncate">{email}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1">
              {onCheckIn && id && !checkedIn && (
                <Button 
                  size="sm" 
                  variant="default"
                  className="field-gradient text-xs h-7"
                  onClick={() => onCheckIn(id)}
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
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleWhatsApp}
                className="text-xs h-7"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                WhatsApp
              </Button>
              
              {email && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEmail}
                  className="text-xs h-7"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}