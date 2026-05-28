import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Phone, MapPin, Clock, MessageCircle, Mail, TrendingUp, Calendar, Star } from "lucide-react";
import { useAttendanceStats } from "@/hooks/useAttendanceStats";
import { useTeams } from "@/hooks/useTeams";
import { getInitialsAvatar } from "@/lib/avatar";

interface PlayerCardProps {
  id?: string;
  name: string;
  nickname: string;
  position: string;
  phone: string;
  email?: string;
  jersey_number?: number;
  profile_image?: string;
  skill_level?: number;
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
  skill_level,
  checkedIn,
  onCheckIn
}: PlayerCardProps) {
  const { activeTeam } = useTeams();
  const { stats, loading: statsLoading } = useAttendanceStats(id, activeTeam?.id);

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

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
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
              <AvatarImage src={profile_image || getInitialsAvatar(name)} alt={name} />
              <AvatarFallback className="text-sm font-semibold bg-primary/20 text-white">
                {name.split(' ').map(n => n[0]).join('')}
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
            
            <p className="text-xs text-white/90 mb-1">"{nickname}"</p>

            {skill_level && (
              <div className="flex items-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3 w-3 ${s <= skill_level ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
                  />
                ))}
              </div>
            )}

            <div className="space-y-1 text-xs text-white/85 mb-3">
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

            {/* Attendance Stats */}
            {!statsLoading && stats && stats.total_games_invited > 0 && (
              <div className="mb-3 p-2 bg-black/30 rounded-md border border-primary/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/70 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    Comparecimento
                  </span>
                  <span className={`text-xs font-bold ${getAttendanceColor(stats.attendance_percentage || 0)}`}>
                    {stats.attendance_percentage?.toFixed(0) || 0}%
                  </span>
                </div>
                <Progress 
                  value={stats.attendance_percentage || 0} 
                  className="h-1.5 mb-1"
                />
                <div className="flex items-center justify-between text-[10px] text-white/60">
                  <span>{stats.total_games_attended}/{stats.total_games_invited} jogos</span>
                  {stats.last_30_days_invited > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Calendar className="h-2.5 w-2.5" />
                      30d: {stats.last_30_days_percentage?.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            )}
            
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