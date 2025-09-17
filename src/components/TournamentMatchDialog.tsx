import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Trophy, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTournaments } from '@/hooks/useTournaments';

interface TournamentMatchDialogProps {
  match: any;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export function TournamentMatchDialog({ 
  match, 
  isOpen, 
  onClose, 
  isAdmin 
}: TournamentMatchDialogProps) {
  const { toast } = useToast();
  const { updateMatchResult, scheduleMatch } = useTournaments();
  
  const [scheduledDate, setScheduledDate] = useState(match?.scheduled_date || '');
  const [scheduledTime, setScheduledTime] = useState(match?.scheduled_time || '');
  const [location, setLocation] = useState(match?.location || '');
  const [score1, setScore1] = useState(match?.score1 || 0);
  const [score2, setScore2] = useState(match?.score2 || 0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (match) {
      setScheduledDate(match.scheduled_date || '');
      setScheduledTime(match.scheduled_time || '');
      setLocation(match.location || '');
      setScore1(match.score1 || 0);
      setScore2(match.score2 || 0);
    }
  }, [match]);

  const handleScheduleMatch = async () => {
    if (!scheduledDate || !scheduledTime || !location.trim()) {
      toast({
        title: "Dados incompletos",
        description: "Preencha data, horário e local do jogo.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      await scheduleMatch(match.id, scheduledDate, scheduledTime, location);
      onClose();
    } catch (error) {
      console.error('Error scheduling match:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateResult = async () => {
    if (score1 < 0 || score2 < 0) {
      toast({
        title: "Placar inválido",
        description: "O placar não pode ser negativo.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateMatchResult(match.id, score1, score2);
      onClose();
    } catch (error) {
      console.error('Error updating match result:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const sendWhatsAppInvite = () => {
    if (!match.player1 || !match.player2) {
      toast({
        title: "Jogadores não definidos",
        description: "Não é possível enviar convite sem os jogadores definidos.",
        variant: "destructive"
      });
      return;
    }

    const message = `🏆 *Convite para Jogo do Campeonato* 🏆

📅 *Data:* ${scheduledDate ? new Date(scheduledDate).toLocaleDateString('pt-BR') : 'A definir'}
🕐 *Horário:* ${scheduledTime || 'A definir'}
📍 *Local:* ${location || 'A definir'}

⚽ *Jogo:* ${match.player1.name} vs ${match.player2.name}

Confirme sua presença!`;

    const encodedMessage = encodeURIComponent(message);
    
    // You could integrate with a WhatsApp API here
    // For now, we'll just open WhatsApp Web with the message
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    
    toast({
      title: "Convite preparado",
      description: "O WhatsApp foi aberto com a mensagem de convite.",
    });
  };

  if (!match) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Detalhes do Jogo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Info */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="text-center">
              <div className="font-bold text-lg">{match.player1?.name || 'TBD'}</div>
              <div className="text-sm text-muted-foreground">{match.player1?.nickname}</div>
            </div>
            
            <div className="text-center">
              {match.status === 'completed' ? (
                <div className="text-2xl font-bold">
                  {match.score1} x {match.score2}
                </div>
              ) : (
                <div className="text-lg text-muted-foreground">vs</div>
              )}
            </div>
            
            <div className="text-center">
              <div className="font-bold text-lg">{match.player2?.name || 'TBD'}</div>
              <div className="text-sm text-muted-foreground">{match.player2?.nickname}</div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge variant={
              match.status === 'completed' ? 'default' :
              match.status === 'in_progress' ? 'secondary' : 'outline'
            }>
              {match.status === 'completed' ? 'Finalizado' :
               match.status === 'in_progress' ? 'Em Andamento' :
               match.status === 'scheduled' ? 'Agendado' : 'Pendente'}
            </Badge>
          </div>

          {isAdmin && (
            <>
              {/* Scheduling Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Agendar Jogo
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Campo do Parque, Quadra da Escola..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleScheduleMatch}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Salvar Agendamento
                  </Button>
                  
                  {scheduledDate && scheduledTime && location && (
                    <Button 
                      variant="outline"
                      onClick={sendWhatsAppInvite}
                      className="flex-1"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Convite
                    </Button>
                  )}
                </div>
              </div>

              {/* Results Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Resultado do Jogo
                </h3>
                
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div className="space-y-2 text-center">
                    <Label>{match.player1?.name || 'Jogador 1'}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={score1}
                      onChange={(e) => setScore1(Number(e.target.value))}
                      className="text-center text-lg font-bold"
                    />
                  </div>
                  
                  <div className="text-center text-lg font-bold text-muted-foreground">
                    X
                  </div>
                  
                  <div className="space-y-2 text-center">
                    <Label>{match.player2?.name || 'Jogador 2'}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={score2}
                      onChange={(e) => setScore2(Number(e.target.value))}
                      className="text-center text-lg font-bold"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleUpdateResult}
                  disabled={isUpdating}
                  className="w-full"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Salvar Resultado
                </Button>
              </div>
            </>
          )}

          {/* Match Details for Non-Admin */}
          {!isAdmin && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Informações do Jogo</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {scheduledDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(scheduledDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                
                {scheduledTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{scheduledTime}</span>
                  </div>
                )}
                
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{location}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}