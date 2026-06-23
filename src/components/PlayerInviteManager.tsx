import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Users, MessageCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTeams } from "@/hooks/useTeams";

interface Player {
  id: string;
  name: string;
  nickname: string;
  position: string;
  phone: string;
  profile_image?: string;
}

interface Game {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
}

interface PlayerInviteManagerProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  onPlayersInvited: (playerIds: string[]) => void;
}

export function PlayerInviteManager({ isOpen, onClose, game, onPlayersInvited }: PlayerInviteManagerProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const { activeTeam } = useTeams();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && activeTeam) {
      fetchPlayers();
    }
  }, [isOpen, activeTeam]);

  const fetchPlayers = async () => {
    if (!activeTeam) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_team_players', { _team_id: activeTeam.id });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de jogadores.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayerIds(prev => 
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPlayerIds.length === players.length) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(players.map(p => p.id));
    }
  };

  const sendWhatsAppInvites = async () => {
    if (!game || selectedPlayerIds.length === 0) return;

    try {
      setInviting(true);
      
      const selectedPlayers = players.filter(p => selectedPlayerIds.includes(p.id));
      const gameDate = new Date(game.date).toLocaleDateString('pt-BR');
      
      const message = `🏆 *Convite para Jogo*\n\n` +
        `📅 **${game.title}**\n` +
        `🗓️ Data: ${gameDate}\n` +
        `🕒 Horário: ${game.time}\n` +
        `📍 Local: ${game.location}\n\n` +
        `Confirme sua presença! ⚽`;

      // Simular envio via WhatsApp Web
      for (const player of selectedPlayers) {
        const whatsappUrl = `https://wa.me/55${player.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        
        // Abrir em nova aba com delay para não sobrecarregar
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, selectedPlayers.indexOf(player) * 500);
      }

      onPlayersInvited(selectedPlayerIds);
      
      toast({
        title: "Convites enviados!",
        description: `${selectedPlayerIds.length} jogadores foram convidados via WhatsApp.`
      });

      onClose();
    } catch (error) {
      console.error('Error sending invites:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar os convites.",
        variant: "destructive"
      });
    } finally {
      setInviting(false);
    }
  };

  if (!game) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Convidar Jogadores - {game.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">
                {players.length} jogadores disponíveis
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={loading}
            >
              {selectedPlayerIds.length === players.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Carregando jogadores...</p>
            </div>
          ) : (
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={(e) => {
                    // Radix Checkbox dispara um clique sintético num input oculto
                    // ao mudar de estado, que sobe (bubble) até aqui — ignorá-lo
                    // evita um loop infinito de toggle (clique real vs. sintético).
                    if (e.target instanceof HTMLInputElement) return;
                    handlePlayerToggle(player.id);
                  }}
                >
                  <Checkbox
                    checked={selectedPlayerIds.includes(player.id)}
                    onCheckedChange={() => handlePlayerToggle(player.id)}
                  />
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={player.profile_image} alt={player.name} />
                    <AvatarFallback>
                      {player.nickname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{player.nickname}</span>
                      <Badge variant="outline" className="text-xs">
                        {player.position}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{player.name}</p>
                    {player.phone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageCircle className="h-3 w-3" />
                        {player.phone}
                      </div>
                    )}
                  </div>

                  {selectedPlayerIds.includes(player.id) && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedPlayerIds.length} jogadores selecionados
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={sendWhatsAppInvites}
                disabled={selectedPlayerIds.length === 0 || inviting}
                className="field-gradient"
              >
                {inviting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar via WhatsApp
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}