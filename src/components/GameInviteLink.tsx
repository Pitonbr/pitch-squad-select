import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Copy, MessageCircle, Mail, Share2, QrCode, ChevronDown, ChevronUp, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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
  const [showQR, setShowQR] = useState(false);
  const inviteLink = `${window.location.origin}/auth?redirect=/game-checkin/${game.id}`;

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
    
    return `🎉 Você está sendo convidado para o grande jogo!

⚽ *"${game.title}"*
📅 ${formattedDate}
📍 ${game.location}
${game.description ? `💬 ${game.description}\n` : ''}
👉 *Clique aqui e faça sua inscrição para a partida:*
🔗 ${inviteLink}

📱 Se ainda não tem o app instalado:
1️⃣ Instale o Soccer Squad
2️⃣ Cadastre-se ou faça login
3️⃣ Sua presença será confirmada automaticamente

Nos vemos no campo! ⚽🔥

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
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>

        {/* QR Code */}
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQR(!showQR)}
            className="gap-2 w-full"
          >
            <QrCode className="h-4 w-4" />
            {showQR ? 'Ocultar QR Code' : 'Mostrar QR Code para check-in presencial'}
            {showQR ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
          </Button>

          {showQR && (
            <div className="mt-3 flex flex-col items-center gap-3 p-4 bg-white rounded-lg border">
              <QRCodeSVG
                value={inviteLink}
                size={192}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="M"
                includeMargin
              />
              <p className="text-xs text-muted-foreground text-center">
                Mostre este QR Code no campo — os jogadores escaneiam e fazem check-in na hora
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const svg = document.querySelector('.qr-code-svg') as SVGElement;
                  if (!svg) return;
                  const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `qr-checkin-${game.id}.svg`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="gap-2"
              >
                <Copy className="h-3 w-3" />
                Baixar QR Code
              </Button>
            </div>
          )}
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