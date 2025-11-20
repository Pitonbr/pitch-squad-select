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
    <Card 
      variant="dark" 
      className={`smooth-transition hover:shadow-[0_0_20px_rgba(63,184,175,0.3)] backdrop-blur-md ${
        checkedIn ? 'ring-2 ring-success shadow-[0_0_20px_rgba(34,197,94,0.4)]' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 text-center">
            <Avatar className="h-12 w-12 mx-auto ring-2 ring-primary/30">
              <AvatarImage src={profile_image} alt={name} />
              <AvatarFallback className="text-sm font-semibold bg-primary/20 text-white">
                {jersey_number || name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {jersey_number && (
              <Badge variant="outline" className="text-xs font-bold mt-1 border-accent text-accent">
                #{jersey_number}
              </Badge>
            )}
          </div>
          
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm truncate text-white">{name}</h3>
              <Badge 
                variant="secondary" 
                className={`text-xs ${positionColors[position] || 'bg-muted'}`}
              >
                <MapPin className="h-3 w-3 mr-1" />
                {position}
              </Badge>
            </div>
            
            <p className="text-xs text-white/70 mb-2">"{nickname}"</p>
            
            <div className="space-y-1 text-xs text-white/60 mb-3">
              <div className="flex items-center">
                <Phone className="h-3 w-3 mr-1 text-primary" />
                {phone}
              </div>
              {email && (
                <div className="flex items-center">
                  <Mail className="h-3 w-3 mr-1 text-primary" />
                  <span className="truncate">{email}</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1">
              {onCheckIn && id && !checkedIn && (
                <Button 
                  size="sm" 
                  variant="default"
                  className="bg-primary hover:bg-accent text-white text-xs h-7 transition-colors"
                  onClick={() => onCheckIn(id)}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Check-in
                </Button>
              )}
              {checkedIn && (
                <Badge variant="default" className="bg-success text-white text-xs">
                  ✓ Confirmado
                </Badge>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleWhatsApp}
                className="text-xs h-7 border-primary/50 text-white hover:bg-primary/20"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                WhatsApp
              </Button>
              
              {email && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEmail}
                  className="text-xs h-7 border-primary/50 text-white hover:bg-primary/20"
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