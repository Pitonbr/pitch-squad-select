import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Copy, MessageCircle, Mail, Share2 } from "lucide-react";

interface Game {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
}

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

interface GameInviteLinkProps {
  game: Game;
  invitedPlayers: Player[];
  createdByName: string;
}

export function GameInviteLink({ game, invitedPlayers, createdByName }: GameInviteLinkProps) {
  const { toast } = useToast();
  const [inviteLink] = useState(() => {
    // Generate a unique invite link for the game
    const baseUrl = window.location.origin;
    return `${baseUrl}/game-invite/${game.id}`;
  });

  const formatGameDate = (date: string, time: string) => {
    const gameDate = new Date(`${date}T${time}`);
    return gameDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) + ' às ' + time;
  };

  const createInviteMessage = (playerName: string) => {
    const formattedDate = formatGameDate(game.date, game.time);
    
    return `🏈 Parabéns ${playerName}! 🏈

Você foi convidado para participar do jogo:

⚽ *${game.title}*
📅 ${formattedDate}
📍 ${game.location}
${game.description ? `\n💬 ${game.description}` : ''}

Para participar você deve:
1️⃣ Fazer login na sua conta no Soccer Squad
2️⃣ Ou baixar e se cadastrar no aplicativo

🔗 *Acesse o jogo:* ${inviteLink}

📱 *Download Android:* https://play.google.com/store/apps/details?id=com.soccersquad
🍎 *Download iOS:* https://apps.apple.com/app/soccer-squad

Nos vemos no campo, jogador!!!

✍️ Convite enviado por: *${createdByName}*`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Link copiado!",
      description: "O link de convite foi copiado para a área de transferência.",
    });
  };

  const sendWhatsAppInvite = (player: Player) => {
    const message = createInviteMessage(player.name);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${player.phone.replace(/\D/g, '')}&text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const sendEmailInvite = (player: Player) => {
    if (!player.email) {
      toast({
        title: "Email não disponível",
        description: `${player.name} não possui email cadastrado.`,
        variant: "destructive"
      });
      return;
    }

    const message = createInviteMessage(player.name);
    const subject = `🏈 Convite para jogo: ${game.title}`;
    const emailUrl = `mailto:${player.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = emailUrl;
  };

  const shareInvite = () => {
    if (navigator.share) {
      navigator.share({
        title: `Convite para jogo: ${game.title}`,
        text: createInviteMessage("Jogador"),
        url: inviteLink,
      });
    } else {
      copyToClipboard();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Share2 className="h-5 w-5 text-primary" />
          <span>Link de Convite do Jogo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            value={inviteLink}
            readOnly
            className="flex-1"
          />
          <Button variant="outline" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={shareInvite}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {invitedPlayers.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Enviar convites individuais:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {invitedPlayers.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} />
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{player.name}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendWhatsAppInvite(player)}
                      className="gap-1"
                    >
                      <MessageCircle className="h-3 w-3" />
                      WhatsApp
                    </Button>
                    {player.email && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendEmailInvite(player)}
                        className="gap-1"
                      >
                        <Mail className="h-3 w-3" />
                        Email
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          <p><strong>Como funciona:</strong></p>
          <p>• O link leva direto para a página do jogo no aplicativo</p>
          <p>• Jogadores podem fazer check-in até {game.date && game.time ? 
            `${(() => {
              const gameDateTime = new Date(`${game.date}T${game.time}`);
              gameDateTime.setMinutes(gameDateTime.getMinutes() - 30); // Default 30 minutes
              return gameDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            })()}` : 'o prazo definido'}</p>
          <p>• Apenas jogadores com check-in feito participam da seleção de times</p>
        </div>
      </CardContent>
    </Card>
  );
}